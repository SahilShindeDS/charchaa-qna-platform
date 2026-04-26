import {
  auth,
  db,
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot
} from "../firebase/client.js";
import { getBookmarks, toggleBookmark } from "../state/preferences.js";
import { showToast, setButtonLoading } from "../ui/feedback.js";

const PAGE_SIZE = 10;

function bookmarkKey(collectionName, docId) {
  return `${collectionName}:${docId}`;
}

function toFriendlyErrorMessage(error, fallbackMessage) {
  const code = String(error?.code || "");
  if (code.includes("permission-denied")) {
    return "Action blocked by security rules. Login with a verified email to post.";
  }
  if (code.includes("unavailable")) {
    return "Network issue. Please check your connection and try again.";
  }
  return error?.message || fallbackMessage;
}

function canWriteContent(user) {
  if (!user) {
    return false;
  }

  const hasPasswordProvider = user.providerData?.some((provider) => provider.providerId === "password");
  if (!hasPasswordProvider) {
    return true;
  }

  return user.emailVerified === true;
}

function writeGateMessage(user) {
  if (!user) {
    return "Read is public. Login to post questions and answers.";
  }

  const hasPasswordProvider = user.providerData?.some((provider) => provider.providerId === "password");
  if (hasPasswordProvider && !user.emailVerified) {
    return "Verify your email first to post questions and answers.";
  }

  return "";
}

function safeMillis(timestamp) {
  return timestamp && typeof timestamp.toDate === "function" ? timestamp.toDate().getTime() : 0;
}

function formatTime(timestamp) {
  return safeMillis(timestamp) ? new Date(timestamp.toDate()).toLocaleString() : "Just now";
}

function sortDocs(docs, sortValue) {
  const sorted = [...docs].sort((a, b) => safeMillis(b.data().timestamp) - safeMillis(a.data().timestamp));
  if (sortValue === "oldest") {
    sorted.reverse();
  }
  return sorted;
}

function renderAnswer(answerSection, answerText) {
  const item = document.createElement("div");
  item.className = "answer-item";
  item.textContent = answerText;
  answerSection.appendChild(item);
}

function attachAnswers({ collectionName, questionId, answerSection }) {
  const answersRef = collection(db, collectionName, questionId, "answers");

  return onSnapshot(answersRef, (snapshot) => {
    answerSection.innerHTML = "";

    if (snapshot.empty) {
      const empty = document.createElement("p");
      empty.className = "meta";
      empty.textContent = "No answers yet.";
      answerSection.appendChild(empty);
      return;
    }

    const sorted = [...snapshot.docs].sort((a, b) => safeMillis(a.data().timestamp) - safeMillis(b.data().timestamp));
    sorted.forEach((answerDoc) => {
      renderAnswer(answerSection, answerDoc.data().answer);
    });
  }, (error) => {
    console.error("Failed to load answers", error);
    answerSection.innerHTML = `<p class="meta">${toFriendlyErrorMessage(error, "Could not load answers.")}</p>`;
  });
}

function createQuestionCard({
  docSnap,
  collectionName,
  onBookmarkToggle,
  onAnyDataChange,
  answerUnsubs,
  toastRoot,
  canWrite,
  writeBlockReason
}) {
  const data = docSnap.data();
  const container = document.createElement("article");
  container.className = "card";

  const head = document.createElement("div");
  head.className = "card-head";

  const title = document.createElement("h4");
  title.className = "card-title";
  title.textContent = data.question;

  const rightMeta = document.createElement("div");
  rightMeta.className = "meta";
  rightMeta.textContent = formatTime(data.timestamp);

  head.appendChild(title);
  head.appendChild(rightMeta);

  const tags = document.createElement("div");
  tags.className = "tag-row";

  const tagCategory = document.createElement("span");
  tagCategory.className = "tag";
  tagCategory.textContent = collectionName === "educationalQuestions" ? "Educational" : "General";

  const key = bookmarkKey(collectionName, docSnap.id);
  const tagSaved = document.createElement("span");
  tagSaved.className = "tag";
  const refreshSavedTag = () => {
    tagSaved.textContent = getBookmarks().has(key) ? "Saved" : "Not Saved";
  };
  refreshSavedTag();

  tags.appendChild(tagCategory);
  tags.appendChild(tagSaved);

  const actionRow = document.createElement("div");
  actionRow.className = "action-row";

  const saveBtn = document.createElement("button");
  saveBtn.className = "btn btn-muted";
  const refreshSaveBtn = () => {
    saveBtn.textContent = getBookmarks().has(key) ? "Remove Save" : "Save";
  };
  refreshSaveBtn();

  saveBtn.onclick = () => {
    toggleBookmark(key);
    refreshSaveBtn();
    refreshSavedTag();
    if (typeof onBookmarkToggle === "function") {
      onBookmarkToggle();
    }
  };

  const reportBtn = document.createElement("button");
  reportBtn.className = "btn btn-muted";
  reportBtn.textContent = "Report";
  reportBtn.onclick = async () => {
    const user = auth.currentUser;
    if (!user) {
      showToast(toastRoot, "Login to report content.", "error");
      return;
    }

    const reason = window.prompt("Report reason (required):", "Spam or inappropriate");
    if (!reason || !reason.trim()) {
      return;
    }

    try {
      await addDoc(collection(db, "reports"), {
        targetType: "question",
        targetCollection: collectionName,
        targetId: docSnap.id,
        targetPath: `${collectionName}/${docSnap.id}`,
        preview: String(data.question || "").slice(0, 240),
        reason: reason.trim().slice(0, 300),
        reportedBy: user.uid,
        status: "open",
        createdAt: serverTimestamp()
      });
      showToast(toastRoot, "Report submitted. Admin will review it.", "success");
    } catch (error) {
      showToast(toastRoot, toFriendlyErrorMessage(error, "Failed to submit report."), "error");
    }
  };

  actionRow.appendChild(saveBtn);
  actionRow.appendChild(reportBtn);

  const answerSection = document.createElement("div");
  answerSection.className = "answer-section";

  const answerInput = document.createElement("textarea");
  answerInput.placeholder = canWrite ? "Write your answer..." : writeBlockReason;
  answerInput.disabled = !canWrite;

  const answerBtn = document.createElement("button");
  answerBtn.className = "btn btn-primary";
  answerBtn.textContent = "Submit Answer";
  answerBtn.disabled = !canWrite;
  answerBtn.onclick = async () => {
    setButtonLoading(answerBtn, true, "Posting...");
    const user = auth.currentUser;
    if (!user) {
      showToast(toastRoot, "Login to answer.", "error");
      setButtonLoading(answerBtn, false);
      return;
    }

    if (!canWriteContent(user)) {
      showToast(toastRoot, "Verify your email first before posting answers.", "error");
      setButtonLoading(answerBtn, false);
      return;
    }

    const answer = answerInput.value.trim();
    if (!answer) {
      showToast(toastRoot, "Enter an answer.", "error");
      setButtonLoading(answerBtn, false);
      return;
    }

    try {
      await addDoc(collection(db, collectionName, docSnap.id, "answers"), {
        answer,
        userId: user.uid,
        timestamp: serverTimestamp()
      });
      answerInput.value = "";
      showToast(toastRoot, "Answer posted.", "success");
      if (typeof onAnyDataChange === "function") {
        onAnyDataChange();
      }
    } catch (error) {
      showToast(toastRoot, toFriendlyErrorMessage(error, "Failed to post answer."), "error");
    } finally {
      setButtonLoading(answerBtn, false);
    }
  };

  const unsubAnswers = attachAnswers({
    collectionName,
    questionId: docSnap.id,
    answerSection
  });
  answerUnsubs.set(docSnap.id, unsubAnswers);

  container.appendChild(head);
  container.appendChild(tags);
  container.appendChild(answerSection);
  container.appendChild(answerInput);
  container.appendChild(answerBtn);

  return container;
}

export function initQuestionSection({
  formEl,
  inputEl,
  listEl,
  collectionName,
  searchEl,
  sortEl,
  bookmarkOnlyEl,
  loadMoreBtn,
  onBookmarkToggle,
  onAnyDataChange,
  toastRoot,
  writeGateEl
}) {
  const categoryRef = collection(db, collectionName);
  let docs = [];
  let currentUser = auth.currentUser;
  let visibleCount = PAGE_SIZE;
  const answerUnsubs = new Map();
  const submitBtn = formEl.querySelector("button[type='submit']");

  const applyComposerState = () => {
    const canWrite = canWriteContent(currentUser);
    const message = writeGateMessage(currentUser);

    inputEl.disabled = !canWrite;
    submitBtn.disabled = !canWrite;
    if (!canWrite && message) {
      inputEl.placeholder = message;
    } else {
      inputEl.placeholder = collectionName === "educationalQuestions"
        ? "Ask your educational question..."
        : "Ask your general question...";
    }

    if (writeGateEl) {
      writeGateEl.textContent = message;
      writeGateEl.classList.remove("error", "success");
      if (message) {
        writeGateEl.classList.add("error");
      }
    }
  };

  const cleanupAnswers = () => {
    answerUnsubs.forEach((unsub) => unsub());
    answerUnsubs.clear();
  };

  const renderList = () => {
    cleanupAnswers();
    listEl.innerHTML = "";
    const canWrite = canWriteContent(currentUser);
    const writeBlockReason = writeGateMessage(currentUser);

    const search = (searchEl.value || "").trim().toLowerCase();
    const bookmarkOnly = bookmarkOnlyEl.checked;

    const filteredDocs = sortDocs(docs, sortEl.value).filter((docSnap) => {
      const text = String(docSnap.data().question || "").toLowerCase();
      if (search && !text.includes(search)) {
        return false;
      }
      if (!bookmarkOnly) {
        return true;
      }
      return getBookmarks().has(bookmarkKey(collectionName, docSnap.id));
    });

    if (!filteredDocs.length) {
      const empty = document.createElement("div");
      empty.className = "empty";
      empty.textContent = docs.length ? "No matching questions." : "No questions yet.";
      listEl.appendChild(empty);
      if (loadMoreBtn) {
        loadMoreBtn.classList.add("hidden");
      }
      return;
    }

    const pagedDocs = filteredDocs.slice(0, visibleCount);

    pagedDocs.forEach((docSnap) => {
      listEl.appendChild(createQuestionCard({
        docSnap,
        collectionName,
        onBookmarkToggle,
        onAnyDataChange,
        answerUnsubs,
        toastRoot,
        canWrite,
        writeBlockReason
      }));
    });

    if (loadMoreBtn) {
      loadMoreBtn.classList.toggle("hidden", filteredDocs.length <= pagedDocs.length);
    }
  };

  formEl.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitBtn = event.submitter || event.target.querySelector("button[type='submit']");
    const question = inputEl.value.trim();
    const user = currentUser;
    setButtonLoading(submitBtn, true, "Posting...");

    if (!question) {
      showToast(toastRoot, "Enter a question.", "error");
      setButtonLoading(submitBtn, false);
      return;
    }

    if (!user) {
      showToast(toastRoot, "Login to submit a question.", "error");
      setButtonLoading(submitBtn, false);
      return;
    }

    if (!canWriteContent(user)) {
      showToast(toastRoot, "Verify your email first before posting questions.", "error");
      setButtonLoading(submitBtn, false);
      return;
    }

    try {
      await addDoc(categoryRef, {
        question,
        userId: user.uid,
        timestamp: serverTimestamp()
      });

      inputEl.value = "";
      showToast(toastRoot, "Question posted.", "success");
      if (typeof onAnyDataChange === "function") {
        onAnyDataChange();
      }
    } catch (error) {
      showToast(toastRoot, toFriendlyErrorMessage(error, "Failed to post question."), "error");
    } finally {
      setButtonLoading(submitBtn, false);
    }
  });

  [searchEl, sortEl, bookmarkOnlyEl].forEach((control) => {
    const resetAndRender = () => {
      visibleCount = PAGE_SIZE;
      renderList();
    };
    control.addEventListener("input", resetAndRender);
    control.addEventListener("change", resetAndRender);
  });

  if (loadMoreBtn) {
    loadMoreBtn.addEventListener("click", () => {
      visibleCount += PAGE_SIZE;
      renderList();
    });
  }

  const unsubQuestions = onSnapshot(categoryRef, (snapshot) => {
    docs = snapshot.docs;
    visibleCount = PAGE_SIZE;
    renderList();
    if (typeof onAnyDataChange === "function") {
      onAnyDataChange();
    }
  }, (error) => {
    console.error(`Failed to load ${collectionName}`, error);
    listEl.innerHTML = `<div class="empty">${toFriendlyErrorMessage(error, "Could not load questions right now. Please refresh.")}</div>`;
    docs = [];
    if (typeof onAnyDataChange === "function") {
      onAnyDataChange();
    }
  });

  return {
    categoryRef,
    getDocs: () => docs,
    setCurrentUser: (user) => {
      currentUser = user;
      applyComposerState();
      renderList();
    },
    renderList,
    teardown: () => {
      cleanupAnswers();
      unsubQuestions();
    }
  };
}
