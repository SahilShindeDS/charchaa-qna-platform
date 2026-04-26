import {
  auth,
  db,
  provider,
  onIdTokenChanged,
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  setDoc,
  doc,
  sendPasswordResetEmail,
  fetchSignInMethodsForEmail,
  sendEmailVerification,
  reload
} from "../firebase/client.js";
import { setMessage, setButtonLoading, showToast } from "../ui/feedback.js";

function showModal(modal) {
  modal.style.display = "block";
}

function hideModal(modal) {
  modal.style.display = "none";
}

function getInboxUrl(email) {
  const domain = String(email || "").split("@")[1] || "";
  if (domain.includes("gmail.com")) {
    return "https://mail.google.com";
  }
  if (domain.includes("outlook.com") || domain.includes("hotmail.com") || domain.includes("live.com")) {
    return "https://outlook.live.com/mail";
  }
  if (domain.includes("yahoo.com")) {
    return "https://mail.yahoo.com";
  }
  return "https://mail.google.com";
}

function showVerificationGuide(dom, email, resent = false) {
  const label = resent ? "Verification email sent again." : "Verification email sent.";
  dom.verifyEmailText.textContent = `${label} Open ${email}, click the verification link, then tap "I've Verified".`;
  const openInboxBtn = document.getElementById("verify-open-mail");
  if (openInboxBtn) {
    openInboxBtn.dataset.inboxUrl = getInboxUrl(email);
  }
  showModal(dom.verifyModal);
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function usesGoogle(methods) {
  return methods.includes("google.com");
}

function usesPassword(methods) {
  return methods.includes("password");
}

function hasPasswordProvider(user) {
  return Boolean(user?.providerData?.some((provider) => provider.providerId === "password"));
}

async function syncUserProfile(user) {
  if (!user || !user.email) {
    return;
  }

  await setDoc(doc(db, "users", user.uid), {
    name: user.displayName || user.email.split("@")[0],
    email: user.email,
    uid: user.uid
  }, { merge: true });
}

export function setupAuth(dom, { onUserChange } = {}) {
  let lastVerifyPromptEmail = null;

  document.getElementById("open-login").onclick = () => showModal(dom.loginModal);
  document.getElementById("open-signup").onclick = () => showModal(dom.signupModal);
  document.getElementById("open-forgot").onclick = () => {
    hideModal(dom.loginModal);
    showModal(dom.forgotModal);
  };
  document.getElementById("open-forgot-from-settings").onclick = () => showModal(dom.forgotModal);

  document.getElementById("close-login").onclick = () => hideModal(dom.loginModal);
  document.getElementById("close-signup").onclick = () => hideModal(dom.signupModal);
  document.getElementById("close-forgot").onclick = () => hideModal(dom.forgotModal);
  document.getElementById("close-verify").onclick = () => hideModal(dom.verifyModal);
  document.getElementById("verify-open-mail").onclick = (event) => {
    const url = event.currentTarget.dataset.inboxUrl || "https://mail.google.com";
    window.open(url, "_blank", "noopener,noreferrer");
  };
  document.getElementById("verify-resend").onclick = async () => {
    const user = auth.currentUser;
    if (!user || !hasPasswordProvider(user)) {
      setMessage(dom.verifyEmailText, "Log in with email/password first to resend verification.", "error");
      return;
    }

    try {
      await sendEmailVerification(user);
      showToast(dom.toastRoot, "Verification email resent.", "success");
      showVerificationGuide(dom, user.email || "");
    } catch (error) {
      showToast(dom.toastRoot, error.message, "error");
    }
  };
  document.getElementById("verify-check").onclick = async () => {
    const user = auth.currentUser;
    if (!user) {
      showToast(dom.toastRoot, "Please log in first, then verify your email.", "error");
      return;
    }

    try {
      await reload(user);
      if (user.emailVerified) {
        hideModal(dom.verifyModal);
        setMessage(dom.loginMsg, "Email verified. You can continue now.", "success");
        showToast(dom.toastRoot, "Email verified successfully.", "success");
        return;
      }
      showToast(dom.toastRoot, "Still not verified yet. Check inbox/spam and click the email link.", "error");
    } catch (error) {
      showToast(dom.toastRoot, error.message, "error");
    }
  };
  document.getElementById("verify-go-login").onclick = () => {
    hideModal(dom.verifyModal);
    showModal(dom.loginModal);
  };

  window.addEventListener("click", (event) => {
    if (event.target === dom.loginModal) {
      hideModal(dom.loginModal);
    }
    if (event.target === dom.signupModal) {
      hideModal(dom.signupModal);
    }
    if (event.target === dom.forgotModal) {
      hideModal(dom.forgotModal);
    }
    if (event.target === dom.verifyModal) {
      hideModal(dom.verifyModal);
    }
  });

  dom.googleLoginBtn.onclick = () => {
    setMessage(dom.loginMsg);
    signInWithPopup(auth, provider).catch(async (error) => {
      if (error.code === "auth/account-exists-with-different-credential") {
        const email = normalizeEmail(error.customData?.email);
        if (email) {
          const methods = await fetchSignInMethodsForEmail(auth, email);
          if (usesPassword(methods)) {
            setMessage(dom.loginMsg, "This email already uses password login. Please use email + password.", "error");
            return;
          }
        }
      }

      showToast(dom.toastRoot, error.message, "error");
    });
  };

  dom.logoutBtn.onclick = () => signOut(auth);

  onIdTokenChanged(auth, (user) => {
    if (user) {
      if (hasPasswordProvider(user) && !user.emailVerified) {
        if (lastVerifyPromptEmail !== user.email) {
          sendEmailVerification(user).catch(() => {});
          showVerificationGuide(dom, user.email || "", true);
          lastVerifyPromptEmail = user.email || "__unknown__";
        }
        showToast(dom.toastRoot, "Please verify your email before using this account.", "error");
        dom.userStatus.textContent = `Email not verified: ${user.email || ""}`;
        dom.googleLoginBtn.style.display = "none";
        dom.logoutBtn.style.display = "inline-block";
        if (typeof onUserChange === "function") {
          onUserChange(user);
        }
        return;
      }

      dom.googleLoginBtn.style.display = "none";
      dom.logoutBtn.style.display = "inline-block";
      dom.userStatus.textContent = `Logged in as ${user.displayName || user.email}`;
      lastVerifyPromptEmail = null;
      syncUserProfile(user).catch(() => {});
      setMessage(dom.loginMsg);
      setMessage(dom.signupMsg);
      setMessage(dom.forgotMsg);
      if (typeof onUserChange === "function") {
        onUserChange(user);
      }
      return;
    }

    dom.googleLoginBtn.style.display = "inline-block";
    dom.logoutBtn.style.display = "none";
    dom.userStatus.textContent = "Not logged in";
    lastVerifyPromptEmail = null;
    if (typeof onUserChange === "function") {
      onUserChange(null);
    }
  });

  document.getElementById("signup-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitBtn = event.submitter || event.target.querySelector("button[type='submit']");
    const name = document.getElementById("signup-name").value.trim();
    const email = normalizeEmail(document.getElementById("signup-email").value);
    const password = document.getElementById("signup-password").value;
    setMessage(dom.signupMsg);
    setButtonLoading(submitBtn, true, "Creating...");

    try {
      const methods = await fetchSignInMethodsForEmail(auth, email);
      if (usesGoogle(methods) && !usesPassword(methods)) {
        setMessage(dom.signupMsg, "This email is already registered with Google. Use Google login.", "error");
        return;
      }

      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCred.user, { displayName: name });
      await sendEmailVerification(userCred.user);
      setMessage(dom.signupMsg, "Verification email sent. Verify your inbox, then login.", "success");
      showToast(dom.toastRoot, "Verify your email to activate this account.", "success");
      hideModal(dom.signupModal);
      showVerificationGuide(dom, email);
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        setMessage(dom.signupMsg, "This email already exists. Try logging in instead.", "error");
        return;
      }
      setMessage(dom.signupMsg, error.message, "error");
    } finally {
      setButtonLoading(submitBtn, false);
    }
  });

  document.getElementById("login-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitBtn = event.submitter || event.target.querySelector("button[type='submit']");
    const email = normalizeEmail(document.getElementById("login-email").value);
    const password = document.getElementById("login-password").value;
    setMessage(dom.loginMsg);
    setButtonLoading(submitBtn, true, "Signing in...");

    try {
      const methods = await fetchSignInMethodsForEmail(auth, email);
      if (usesGoogle(methods) && !usesPassword(methods)) {
        setMessage(dom.loginMsg, "This account uses Google sign-in. Click Google to continue.", "error");
        return;
      }

      await signInWithEmailAndPassword(auth, email, password);
      if (auth.currentUser && hasPasswordProvider(auth.currentUser) && !auth.currentUser.emailVerified) {
        await sendEmailVerification(auth.currentUser);
        setMessage(dom.loginMsg, "Email not verified. We sent a new verification link to your inbox.", "error");
        showVerificationGuide(dom, email, true);
        return;
      }
      showToast(dom.toastRoot, "Welcome back.", "success");
      hideModal(dom.loginModal);
    } catch (error) {
      if (error.code === "auth/user-not-found") {
        setMessage(dom.loginMsg, "No account found for this email. Please sign up first.", "error");
        return;
      }

      if (error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
        setMessage(dom.loginMsg, "Incorrect password. Try again or use Forgot Password.", "error");
        return;
      }

      setMessage(dom.loginMsg, error.message, "error");
    } finally {
      setButtonLoading(submitBtn, false);
    }
  });

  document.getElementById("forgot-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitBtn = event.submitter || event.target.querySelector("button[type='submit']");
    const email = normalizeEmail(document.getElementById("forgot-email").value);
    setMessage(dom.forgotMsg);
    setButtonLoading(submitBtn, true, "Sending...");

    if (!email.includes("@")) {
      setMessage(dom.forgotMsg, "Enter a valid email address.", "error");
      setButtonLoading(submitBtn, false);
      return;
    }

    try {
      const methods = await fetchSignInMethodsForEmail(auth, email);
      if (methods.length > 0 && !methods.includes("password")) {
        setMessage(dom.forgotMsg, "This email is linked to social login. Use Google login instead.", "error");
        return;
      }

      await sendPasswordResetEmail(auth, email, {
        url: `${window.location.origin}/index.html`,
        handleCodeInApp: false
      });

      setMessage(dom.forgotMsg, "Reset email sent. Check inbox/spam/promotions.", "success");
      showToast(dom.toastRoot, "Password reset email sent.", "success");
      hideModal(dom.forgotModal);
    } catch (error) {
      if (error.code === "auth/invalid-email") {
        setMessage(dom.forgotMsg, "Invalid email format.", "error");
        return;
      }

      if (error.code === "auth/too-many-requests") {
        setMessage(dom.forgotMsg, "Too many attempts. Wait a few minutes and try again.", "error");
        return;
      }

      if (error.code === "auth/unauthorized-continue-uri") {
        setMessage(dom.forgotMsg, "Reset link domain is not authorized in Firebase Auth settings.", "error");
        return;
      }

      setMessage(dom.forgotMsg, error.message, "error");
    } finally {
      setButtonLoading(submitBtn, false);
    }
  });
}

export function getCurrentUser() {
  return auth.currentUser;
}
