import {
  auth,
  db,
  provider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  setDoc,
  doc,
  sendPasswordResetEmail,
  fetchSignInMethodsForEmail
} from "../firebase/client.js";

function showModal(modal) {
  modal.style.display = "block";
}

function hideModal(modal) {
  modal.style.display = "none";
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

export function setupAuth(dom, { onUserChange } = {}) {
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
  });

  dom.googleLoginBtn.onclick = () => {
    signInWithPopup(auth, provider).catch(async (error) => {
      if (error.code === "auth/account-exists-with-different-credential") {
        const email = normalizeEmail(error.customData?.email);
        if (email) {
          const methods = await fetchSignInMethodsForEmail(auth, email);
          if (usesPassword(methods)) {
            alert("This email already uses password login. Please log in with email and password.");
            return;
          }
        }
      }

      alert(error.message);
    });
  };

  dom.logoutBtn.onclick = () => signOut(auth);

  onAuthStateChanged(auth, (user) => {
    if (user) {
      dom.googleLoginBtn.style.display = "none";
      dom.logoutBtn.style.display = "inline-block";
      dom.userStatus.textContent = `Logged in as ${user.displayName || user.email}`;
      if (typeof onUserChange === "function") {
        onUserChange(user);
      }
      return;
    }

    dom.googleLoginBtn.style.display = "inline-block";
    dom.logoutBtn.style.display = "none";
    dom.userStatus.textContent = "Not logged in";
    if (typeof onUserChange === "function") {
      onUserChange(null);
    }
  });

  document.getElementById("signup-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = document.getElementById("signup-name").value.trim();
    const email = normalizeEmail(document.getElementById("signup-email").value);
    const password = document.getElementById("signup-password").value;

    try {
      const methods = await fetchSignInMethodsForEmail(auth, email);
      if (usesGoogle(methods) && !usesPassword(methods)) {
        alert("This email is already registered with Google. Please use Google login.");
        return;
      }

      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCred.user, { displayName: name });
      await setDoc(doc(db, "users", userCred.user.uid), {
        name,
        email,
        uid: userCred.user.uid
      });
      hideModal(dom.signupModal);
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        alert("This email already exists. Try logging in instead.");
        return;
      }
      alert(error.message);
    }
  });

  document.getElementById("login-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = normalizeEmail(document.getElementById("login-email").value);
    const password = document.getElementById("login-password").value;

    try {
      const methods = await fetchSignInMethodsForEmail(auth, email);
      if (usesGoogle(methods) && !usesPassword(methods)) {
        alert("This account uses Google sign-in. Please click \"Google\" to continue.");
        return;
      }

      await signInWithEmailAndPassword(auth, email, password);
      hideModal(dom.loginModal);
    } catch (error) {
      if (error.code === "auth/user-not-found") {
        alert("No account found for this email. Please sign up first.");
        return;
      }

      if (error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
        alert("Incorrect password. Try again or use Forgot Password.");
        return;
      }

      alert(error.message);
    }
  });

  document.getElementById("forgot-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = normalizeEmail(document.getElementById("forgot-email").value);

    if (!email.includes("@")) {
      alert("Enter a valid email address.");
      return;
    }

    try {
      const methods = await fetchSignInMethodsForEmail(auth, email);
      if (methods.length > 0 && !methods.includes("password")) {
        alert("This email is linked to social login. Use Google login instead.");
        return;
      }

      await sendPasswordResetEmail(auth, email, {
        url: `${window.location.origin}/index.html`,
        handleCodeInApp: false
      });

      alert("Reset email sent. Check inbox, spam, and promotions folders.");
      hideModal(dom.forgotModal);
    } catch (error) {
      if (error.code === "auth/invalid-email") {
        alert("Invalid email format.");
        return;
      }

      if (error.code === "auth/too-many-requests") {
        alert("Too many attempts. Please wait a few minutes and try again.");
        return;
      }

      if (error.code === "auth/unauthorized-continue-uri") {
        alert("Reset link domain is not authorized in Firebase Auth settings.");
        return;
      }

      alert(error.message);
    }
  });
}

export function getCurrentUser() {
  return auth.currentUser;
}
