export function getDom() {
  return {
    homeSection: document.getElementById("home-section"),
    eduSection: document.getElementById("edu-section"),
    genSection: document.getElementById("gen-section"),
    adminSection: document.getElementById("admin-section"),
    userStatus: document.getElementById("user-status"),
    googleLoginBtn: document.getElementById("google-login"),
    logoutBtn: document.getElementById("logout-btn"),
    loginModal: document.getElementById("login-modal"),
    signupModal: document.getElementById("signup-modal"),
    eduForm: document.getElementById("edu-question-form"),
    eduInput: document.getElementById("edu-question"),
    eduList: document.getElementById("edu-questions-list"),
    genForm: document.getElementById("general-question-form"),
    genInput: document.getElementById("general-question"),
    genList: document.getElementById("general-questions-list"),
    adminContainer: document.getElementById("admin-questions")
  };
}
