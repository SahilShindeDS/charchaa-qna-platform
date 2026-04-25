import { ADMIN_UID } from "./config/firebaseConfig.js";
import { auth } from "./firebase/client.js";
import { getDom } from "./ui/dom.js";
import { setupNavigation } from "./ui/navigation.js";
import { setupAuth } from "./auth/initAuth.js";
import { initQuestionSection } from "./questions/initQuestionSection.js";
import { loadAdminPanel } from "./admin/loadAdminPanel.js";
import { getBookmarks } from "./state/preferences.js";
import { setupSettings, syncSettingsUser } from "./settings/initSettings.js";

const dom = getDom();
setupSettings(dom);

let currentUser = null;
let eduController = null;
let genController = null;

function toCombinedQuestions(eduDocs, genDocs) {
  const decorate = (docs, category) => docs.map((docSnap) => ({
    id: docSnap.id,
    category,
    key: `${category}:${docSnap.id}`,
    ...docSnap.data()
  }));

  return [...decorate(eduDocs, "educationalQuestions"), ...decorate(genDocs, "generalQuestions")]
    .sort((a, b) => {
      const aTime = a.timestamp ? a.timestamp.toDate().getTime() : 0;
      const bTime = b.timestamp ? b.timestamp.toDate().getTime() : 0;
      return bTime - aTime;
    });
}

function renderSimpleCards(container, items, emptyLabel) {
  container.innerHTML = "";

  if (!items.length) {
    container.innerHTML = `<div class=\"empty\">${emptyLabel}</div>`;
    return;
  }

  items.forEach((item) => {
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <div class="card-head">
        <h4 class="card-title">${item.question}</h4>
        <span class="meta">${item.timestamp ? new Date(item.timestamp.toDate()).toLocaleString() : "Just now"}</span>
      </div>
      <div class="tag-row">
        <span class="tag">${item.category === "educationalQuestions" ? "Educational" : "General"}</span>
      </div>
    `;
    container.appendChild(card);
  });
}

function refreshDerivedPages() {
  if (!eduController || !genController) {
    return;
  }

  const combined = toCombinedQuestions(eduController.getDocs(), genController.getDocs());
  const bookmarks = getBookmarks();

  dom.statEdu.textContent = String(eduController.getDocs().length);
  dom.statGen.textContent = String(genController.getDocs().length);
  dom.statSaved.textContent = String(bookmarks.size);

  const myItems = currentUser ? combined.filter((item) => item.userId === currentUser.uid) : [];
  dom.statMy.textContent = String(myItems.length);

  renderSimpleCards(dom.dashboardFeed, combined.slice(0, 8), "No questions posted yet.");
  renderSimpleCards(dom.myActivityList, myItems, currentUser ? "You have not posted yet." : "Login to view your activity.");

  const savedItems = combined.filter((item) => bookmarks.has(item.key));
  renderSimpleCards(dom.savedQuestionsList, savedItems, "No saved questions yet.");
}

const handleDataChange = () => {
  refreshDerivedPages();
};

setupAuth(dom, {
  onUserChange: (user) => {
    currentUser = user;
    syncSettingsUser(dom, user);
    refreshDerivedPages();
  }
});

eduController = initQuestionSection({
  formEl: dom.eduForm,
  inputEl: dom.eduInput,
  listEl: dom.eduList,
  collectionName: "educationalQuestions",
  searchEl: dom.eduSearch,
  sortEl: dom.eduSort,
  bookmarkOnlyEl: dom.eduBookmarkOnly,
  onBookmarkToggle: handleDataChange,
  onAnyDataChange: handleDataChange
});

genController = initQuestionSection({
  formEl: dom.genForm,
  inputEl: dom.genInput,
  listEl: dom.genList,
  collectionName: "generalQuestions",
  searchEl: dom.genSearch,
  sortEl: dom.genSort,
  bookmarkOnlyEl: dom.genBookmarkOnly,
  onBookmarkToggle: handleDataChange,
  onAnyDataChange: handleDataChange
});

setupNavigation({
  dom,
  isAdmin: () => auth.currentUser && auth.currentUser.uid === ADMIN_UID,
  onAdminOpen: async () => {
    await loadAdminPanel({
      adminContainer: dom.adminContainer,
      eduRef: eduController.categoryRef,
      genRef: genController.categoryRef
    });
  },
  onSectionChange: () => {
    refreshDerivedPages();
  }
});

refreshDerivedPages();
