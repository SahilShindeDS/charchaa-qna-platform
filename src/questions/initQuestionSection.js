import {
  auth,
  db,
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot
} from "../firebase/client.js";
import { getBookmarks, toggleBookmark } from "../state/preferences.js";

function bookmarkKey(collectionName, docId) {
  return `${collectionName}:${docId}`;
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
    answerSection.innerHTML = "<p class=\"meta\">Could not load answers.</p>";
  });
}

function createQuestionCard({
  docSnap,
  collectionName,
  onBookmarkToggle,
  onAnyDataChange,
  answerUnsubs
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

  actionRow.appendChild(saveBtn);

  const answerSection = document.createElement("div");
  answerSection.className = "answer-section";

  const answerInput = document.createElement("textarea");
  answerInput.placeholder = "Write your answer...";

  const answerBtn = document.createElement("button");
  answerBtn.className = "btn btn-primary";
  answerBtn.textContent = "Submit Answer";
  answerBtn.onclick = async () => {
    const user = auth.currentUser;
    if (!user) {
      alert("Login to answer.");
      return;
    }

    const answer = answerInput.value.trim();
    if (!answer) {
      alert("Enter an answer.");
      return;
    }

    await addDoc(collection(db, collectionName, docSnap.id, "answers"), {
      answer,
      userId: user.uid,
      timestamp: serverTimestamp()
    });
    answerInput.value = "";
    if (typeof onAnyDataChange === "function") {
      onAnyDataChange();
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
  onBookmarkToggle,
  onAnyDataChange
}) {
  const categoryRef = collection(db, collectionName);
  let docs = [];
  const answerUnsubs = new Map();

  const cleanupAnswers = () => {
    answerUnsubs.forEach((unsub) => unsub());
    answerUnsubs.clear();
  };

  const renderList = () => {
    cleanupAnswers();
    listEl.innerHTML = "";

    const search = (searchEl.value || "").trim().toLowerCase();
    const bookmarkOnly = bookmarkOnlyEl.checked;

    const visibleDocs = sortDocs(docs, sortEl.value).filter((docSnap) => {
      const text = String(docSnap.data().question || "").toLowerCase();
      if (search && !text.includes(search)) {
        return false;
      }
      if (!bookmarkOnly) {
        return true;
      }
      return getBookmarks().has(bookmarkKey(collectionName, docSnap.id));
    });

    if (!visibleDocs.length) {
      const empty = document.createElement("div");
      empty.className = "empty";
      empty.textContent = docs.length ? "No matching questions." : "No questions yet.";
      listEl.appendChild(empty);
      return;
    }

    visibleDocs.forEach((docSnap) => {
      listEl.appendChild(createQuestionCard({
        docSnap,
        collectionName,
        onBookmarkToggle,
        onAnyDataChange,
        answerUnsubs
      }));
    });
  };

  formEl.addEventListener("submit", async (event) => {
    event.preventDefault();
    const question = inputEl.value.trim();
    const user = auth.currentUser;

    if (!question) {
      alert("Enter a question.");
      return;
    }

    if (!user) {
      alert("Login to submit a question.");
      return;
    }

    await addDoc(categoryRef, {
      question,
      userId: user.uid,
      timestamp: serverTimestamp()
    });

    inputEl.value = "";
    if (typeof onAnyDataChange === "function") {
      onAnyDataChange();
    }
  });

  [searchEl, sortEl, bookmarkOnlyEl].forEach((control) => {
    control.addEventListener("input", renderList);
    control.addEventListener("change", renderList);
  });

  const unsubQuestions = onSnapshot(categoryRef, (snapshot) => {
    docs = snapshot.docs;
    renderList();
    if (typeof onAnyDataChange === "function") {
      onAnyDataChange();
    }
  }, (error) => {
    console.error(`Failed to load ${collectionName}`, error);
    listEl.innerHTML = `<div class=\"empty\">Could not load ${collectionName}. Check Firestore rules/permissions.</div>`;
    docs = [];
    if (typeof onAnyDataChange === "function") {
      onAnyDataChange();
    }
  });

  return {
    categoryRef,
    getDocs: () => docs,
    renderList,
    teardown: () => {
      cleanupAnswers();
      unsubQuestions();
    }
  };
}
