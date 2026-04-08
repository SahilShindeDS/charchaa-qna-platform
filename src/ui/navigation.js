export function showSection(activeSection, sections) {
  sections.forEach((section) => section.classList.remove("active"));
  activeSection.classList.add("active");
}

export function setupNavigation({ dom, isAdmin, onAdminOpen }) {
  document.getElementById("go-edu").onclick = () => showSection(dom.eduSection, [dom.homeSection, dom.genSection, dom.adminSection, dom.eduSection]);
  document.getElementById("go-gen").onclick = () => showSection(dom.genSection, [dom.homeSection, dom.eduSection, dom.adminSection, dom.genSection]);

  document.getElementById("go-admin").onclick = async () => {
    if (!isAdmin()) {
      alert("Only admin can access this section.");
      return;
    }

    showSection(dom.adminSection, [dom.homeSection, dom.eduSection, dom.genSection, dom.adminSection]);
    await onAdminOpen();
  };

  document.getElementById("back-home-edu").onclick = () => showSection(dom.homeSection, [dom.eduSection, dom.homeSection]);
  document.getElementById("back-home-gen").onclick = () => showSection(dom.homeSection, [dom.genSection, dom.homeSection]);
  document.getElementById("back-home-admin").onclick = () => showSection(dom.homeSection, [dom.adminSection, dom.homeSection]);
}
