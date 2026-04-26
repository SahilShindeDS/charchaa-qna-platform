import { getDom } from "../ui/dom.js";
import { setupNavigation, showSection, setAdminVisibility } from "../ui/navigation.js";
import { showToast } from "../ui/feedback.js";
import { setupAuth } from "../auth/initAuth.js";
import { initQuestionSection } from "../questions/initQuestionSection.js";
import { loadAdminPanel } from "../admin/loadAdminPanel.js";
import { getBookmarks } from "../state/preferences.js";
import { setupSettings, syncSettingsUser } from "../settings/initSettings.js";
import { buildCombinedQuestions } from "../pages/questionItems.js";
import { renderDashboardPage } from "../pages/dashboardPage.js";
import { renderMyActivityPage } from "../pages/myActivityPage.js";
import { renderSavedPage } from "../pages/savedPage.js";

export function initApp() {
  const dom = getDom();
  setupSettings(dom);

  let currentUser = null;
  let currentIsAdmin = false;
  let eduController = null;
  let genController = null;

  function refreshDerivedPages() {
    if (!eduController || !genController) {
      return;
    }

    const eduDocs = eduController.getDocs();
    const genDocs = genController.getDocs();
    const bookmarks = getBookmarks();
    const combined = buildCombinedQuestions(eduDocs, genDocs);

    dom.statEdu.textContent = String(eduDocs.length);
    dom.statGen.textContent = String(genDocs.length);
    dom.statSaved.textContent = String(bookmarks.size);

    renderDashboardPage(dom, combined);
    const myCount = renderMyActivityPage(dom, combined, currentUser);
    dom.statMy.textContent = String(myCount);
    renderSavedPage(dom, combined, bookmarks);
  }

  function handleDataChange() {
    refreshDerivedPages();
  }

  function applyAdminVisibility(isAdmin) {
    setAdminVisibility(dom, isAdmin);

    if (!isAdmin && dom.adminSection.classList.contains("active")) {
      showSection(dom, "dashboard-section");
      showToast(dom.toastRoot, "Admin panel is visible only to admin users.", "error");
    }
  }

  function updateAuthHint(user) {
    if (!user) {
      dom.authStateHint.textContent = "Read is public. Login to post questions and answers.";
      return;
    }

    const hasPasswordProvider = user.providerData?.some((provider) => provider.providerId === "password");
    if (hasPasswordProvider && !user.emailVerified) {
      dom.authStateHint.textContent = "Your email is not verified yet. Verify email to enable posting.";
      return;
    }

    dom.authStateHint.textContent = "You can read and post questions/answers.";
  }

  async function resolveAdminClaim(user) {
    if (!user) {
      return false;
    }

    try {
      const tokenResult = await user.getIdTokenResult();
      return tokenResult.claims.admin === true;
    } catch {
      return false;
    }
  }

  setupAuth(dom, {
    onUserChange: async (user) => {
      currentUser = user;
      currentIsAdmin = await resolveAdminClaim(user);
      syncSettingsUser(dom, user);
      updateAuthHint(user);
      applyAdminVisibility(currentIsAdmin);
      if (eduController && genController) {
        eduController.setCurrentUser(user);
        genController.setCurrentUser(user);
      }
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
    loadMoreBtn: dom.eduLoadMore,
    onBookmarkToggle: handleDataChange,
    onAnyDataChange: handleDataChange,
    toastRoot: dom.toastRoot,
    writeGateEl: dom.eduWriteGate
  });

  genController = initQuestionSection({
    formEl: dom.genForm,
    inputEl: dom.genInput,
    listEl: dom.genList,
    collectionName: "generalQuestions",
    searchEl: dom.genSearch,
    sortEl: dom.genSort,
    bookmarkOnlyEl: dom.genBookmarkOnly,
    loadMoreBtn: dom.genLoadMore,
    onBookmarkToggle: handleDataChange,
    onAnyDataChange: handleDataChange,
    toastRoot: dom.toastRoot,
    writeGateEl: dom.genWriteGate
  });

  setupNavigation({
    dom,
    isAdmin: () => currentIsAdmin,
    onAdminOpen: async () => {
      await loadAdminPanel({
        adminContainer: dom.adminContainer,
        eduRef: eduController.categoryRef,
        genRef: genController.categoryRef
      });
    },
    onSectionChange: (_target, message) => {
      if (message) {
        showToast(dom.toastRoot, message, "error");
      }
      refreshDerivedPages();
    }
  });

  applyAdminVisibility(false);
  updateAuthHint(null);
  eduController.setCurrentUser(currentUser);
  genController.setCurrentUser(currentUser);
  refreshDerivedPages();
}
