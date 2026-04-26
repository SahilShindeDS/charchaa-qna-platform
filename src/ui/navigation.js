function titleFromTarget(targetId) {
  const lookup = {
    "dashboard-section": "Dashboard",
    "edu-section": "Educational",
    "gen-section": "General",
    "my-section": "My Activity",
    "saved-section": "Saved",
    "settings-section": "Settings",
    "admin-section": "Admin"
  };
  return lookup[targetId] || "Charchaa";
}

export function showSection(dom, targetId) {
  dom.sections.forEach((section) => {
    section.classList.toggle("active", section.id === targetId);
  });

  dom.navLinks.forEach((link) => {
    link.classList.toggle("active", link.dataset.target === targetId);
  });

  dom.topTitle.textContent = titleFromTarget(targetId);
}

export function setAdminVisibility(dom, isVisible) {
  if (!dom.navAdmin) {
    return;
  }

  dom.navAdmin.classList.toggle("hidden", !isVisible);
  dom.navAdmin.style.display = isVisible ? "" : "none";
  dom.navAdmin.setAttribute("aria-hidden", isVisible ? "false" : "true");
}

export function setupNavigation({ dom, isAdmin, onAdminOpen, onSectionChange }) {
  dom.navLinks.forEach((link) => {
    link.addEventListener("click", async () => {
      const target = link.dataset.target;

      if (target === "admin-section" && !isAdmin()) {
        if (typeof onSectionChange === "function") {
          onSectionChange("dashboard-section", "Admin access is restricted.");
        }
        return;
      }

      showSection(dom, target);

      if (target === "admin-section") {
        await onAdminOpen();
      }

      if (typeof onSectionChange === "function") {
        onSectionChange(target);
      }
    });
  });
}
