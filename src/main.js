import { ADMIN_UID } from "./config/firebaseConfig.js";
import { auth } from "./firebase/client.js";
import { getDom } from "./ui/dom.js";
import { setupNavigation } from "./ui/navigation.js";
import { setupAuth } from "./auth/initAuth.js";
import { initQuestionSection } from "./questions/initQuestionSection.js";
import { loadAdminPanel } from "./admin/loadAdminPanel.js";

const dom = getDom();
setupAuth(dom);

const eduRef = initQuestionSection({
  formEl: dom.eduForm,
  inputEl: dom.eduInput,
  listEl: dom.eduList,
  categoryCollection: "educationalQuestions"
});

const genRef = initQuestionSection({
  formEl: dom.genForm,
  inputEl: dom.genInput,
  listEl: dom.genList,
  categoryCollection: "generalQuestions"
});

setupNavigation({
  dom,
  isAdmin: () => auth.currentUser && auth.currentUser.uid === ADMIN_UID,
  onAdminOpen: async () => {
    await loadAdminPanel({
      adminContainer: dom.adminContainer,
      eduRef,
      genRef
    });
  }
});
