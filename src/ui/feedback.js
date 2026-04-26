export function setMessage(el, text = "", type = "") {
  if (!el) {
    return;
  }

  el.textContent = text;
  el.classList.remove("error", "success");
  if (type) {
    el.classList.add(type);
  }
}

export function setButtonLoading(buttonEl, isLoading, loadingText = "Please wait...") {
  if (!buttonEl) {
    return;
  }

  if (isLoading) {
    buttonEl.dataset.originalText = buttonEl.textContent;
    buttonEl.textContent = loadingText;
    buttonEl.disabled = true;
    return;
  }

  buttonEl.textContent = buttonEl.dataset.originalText || buttonEl.textContent;
  buttonEl.disabled = false;
}

export function showToast(root, message, type = "") {
  if (!root || !message) {
    return;
  }

  const toast = document.createElement("div");
  toast.className = `toast ${type}`.trim();
  toast.textContent = message;
  root.appendChild(toast);

  window.setTimeout(() => {
    toast.remove();
  }, 3200);
}
