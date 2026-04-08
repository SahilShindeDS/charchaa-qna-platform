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
  doc
} from "../firebase/client.js";

export function setupAuth(dom) {
  document.getElementById("open-login").onclick = () => {
    dom.loginModal.style.display = "block";
  };
  document.getElementById("open-signup").onclick = () => {
    dom.signupModal.style.display = "block";
  };
  document.getElementById("close-login").onclick = () => {
    dom.loginModal.style.display = "none";
  };
  document.getElementById("close-signup").onclick = () => {
    dom.signupModal.style.display = "none";
  };

  window.onclick = (event) => {
    if (event.target === dom.loginModal) {
      dom.loginModal.style.display = "none";
    }
    if (event.target === dom.signupModal) {
      dom.signupModal.style.display = "none";
    }
  };

  dom.googleLoginBtn.onclick = () => {
    signInWithPopup(auth, provider).catch((error) => alert(error.message));
  };

  dom.logoutBtn.onclick = () => signOut(auth);

  onAuthStateChanged(auth, (user) => {
    if (user) {
      dom.googleLoginBtn.style.display = "none";
      dom.logoutBtn.style.display = "inline-block";
      dom.userStatus.textContent = `Logged in as ${user.displayName}`;
      return;
    }

    dom.googleLoginBtn.style.display = "inline-block";
    dom.logoutBtn.style.display = "none";
    dom.userStatus.textContent = "Not logged in";
  });

  document.getElementById("signup-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = document.getElementById("signup-name").value;
    const email = document.getElementById("signup-email").value;
    const password = document.getElementById("signup-password").value;

    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCred.user, { displayName: name });
      await setDoc(doc(db, "users", userCred.user.uid), {
        name,
        email,
        uid: userCred.user.uid
      });
      dom.signupModal.style.display = "none";
    } catch (error) {
      alert(error.message);
    }
  });

  document.getElementById("login-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      dom.loginModal.style.display = "none";
    } catch (error) {
      alert(error.message);
    }
  });
}

export function getCurrentUser() {
  return auth.currentUser;
}
