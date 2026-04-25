import { auth, db, updateProfile, setDoc, doc } from "../firebase/client.js";
import { getPreferences, savePreferences, applyPreferences } from "../state/preferences.js";

export function setupSettings(dom) {
  let prefs = getPreferences();
  applyPreferences(prefs);

  dom.themeSelect.value = prefs.theme;
  dom.compactMode.checked = Boolean(prefs.compactMode);
  dom.notifyToggle.checked = Boolean(prefs.notifications);

  const persist = (next) => {
    prefs = next;
    savePreferences(next);
    applyPreferences(next);
  };

  dom.themeSelect.addEventListener("change", () => {
    persist({ ...prefs, theme: dom.themeSelect.value });
  });

  dom.compactMode.addEventListener("change", () => {
    persist({ ...prefs, compactMode: dom.compactMode.checked });
  });

  dom.notifyToggle.addEventListener("change", () => {
    persist({ ...prefs, notifications: dom.notifyToggle.checked });
  });

  dom.profileForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const user = auth.currentUser;
    const name = dom.profileDisplayName.value.trim();

    if (!user) {
      alert("Login first to update profile.");
      return;
    }

    if (!name) {
      alert("Display name cannot be empty.");
      return;
    }

    try {
      await updateProfile(user, { displayName: name });
      await setDoc(doc(db, "users", user.uid), {
        name,
        uid: user.uid,
        email: user.email
      }, { merge: true });
      dom.profileStatus.textContent = "Profile updated successfully.";
    } catch (error) {
      dom.profileStatus.textContent = "Failed to update profile.";
      alert(error.message);
    }
  });
}

export function syncSettingsUser(dom, user) {
  if (!user) {
    dom.profileDisplayName.value = "";
    dom.profileStatus.textContent = "Login to edit your profile.";
    return;
  }

  dom.profileDisplayName.value = user.displayName || "";
  dom.profileStatus.textContent = `Signed in as ${user.displayName || user.email}`;
}
