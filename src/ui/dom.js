export function getDom() {
  return {
    sections: Array.from(document.querySelectorAll(".section")),
    navLinks: Array.from(document.querySelectorAll(".nav-link")),

    topTitle: document.getElementById("top-title"),
    userStatus: document.getElementById("user-status"),
    authStateHint: document.getElementById("auth-state-hint"),
    googleLoginBtn: document.getElementById("google-login"),
    logoutBtn: document.getElementById("logout-btn"),
    navAdmin: document.getElementById("nav-admin"),

    loginModal: document.getElementById("login-modal"),
    signupModal: document.getElementById("signup-modal"),
    forgotModal: document.getElementById("forgot-modal"),
    verifyModal: document.getElementById("verify-modal"),

    loginMsg: document.getElementById("login-msg"),
    signupMsg: document.getElementById("signup-msg"),
    forgotMsg: document.getElementById("forgot-msg"),
    verifyEmailText: document.getElementById("verify-email-text"),
    toastRoot: document.getElementById("toast-root"),

    dashboardSection: document.getElementById("dashboard-section"),
    eduSection: document.getElementById("edu-section"),
    genSection: document.getElementById("gen-section"),
    mySection: document.getElementById("my-section"),
    savedSection: document.getElementById("saved-section"),
    settingsSection: document.getElementById("settings-section"),
    adminSection: document.getElementById("admin-section"),

    eduForm: document.getElementById("edu-question-form"),
    eduInput: document.getElementById("edu-question"),
    eduList: document.getElementById("edu-questions-list"),
    eduSearch: document.getElementById("edu-search"),
    eduSort: document.getElementById("edu-sort"),
    eduBookmarkOnly: document.getElementById("edu-bookmark-only"),
    eduLoadMore: document.getElementById("edu-load-more"),
    eduWriteGate: document.getElementById("edu-write-gate"),

    genForm: document.getElementById("general-question-form"),
    genInput: document.getElementById("general-question"),
    genList: document.getElementById("general-questions-list"),
    genSearch: document.getElementById("gen-search"),
    genSort: document.getElementById("gen-sort"),
    genBookmarkOnly: document.getElementById("gen-bookmark-only"),
    genLoadMore: document.getElementById("gen-load-more"),
    genWriteGate: document.getElementById("gen-write-gate"),

    dashboardFeed: document.getElementById("dashboard-feed"),
    myActivityList: document.getElementById("my-activity-list"),
    savedQuestionsList: document.getElementById("saved-questions-list"),
    adminContainer: document.getElementById("admin-questions"),

    statEdu: document.getElementById("stat-edu"),
    statGen: document.getElementById("stat-gen"),
    statSaved: document.getElementById("stat-saved"),
    statMy: document.getElementById("stat-my"),

    themeSelect: document.getElementById("theme-select"),
    compactMode: document.getElementById("compact-mode"),
    notifyToggle: document.getElementById("notify-toggle"),
    profileForm: document.getElementById("profile-form"),
    profileDisplayName: document.getElementById("profile-display-name"),
    profileStatus: document.getElementById("profile-status")
  };
}
