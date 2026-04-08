import { db, collection, getDocs } from "../firebase/client.js";

function buildUserMap(userDocs) {
  const users = new Map();
  userDocs.forEach((docSnap) => {
    users.set(docSnap.id, docSnap.data());
  });
  return users;
}

function renderQuestion(container, data, userInfo) {
  const card = document.createElement("div");
  card.className = "admin-card";
  card.innerHTML = `<h4>${data.question}</h4><p>User: ${userInfo?.name || data.userId} | Email: ${userInfo?.email || "N/A"}<br>Posted: ${data.timestamp ? new Date(data.timestamp.toDate()).toLocaleString() : "Just now"}</p>`;
  container.appendChild(card);
}

export async function loadAdminPanel({ adminContainer, eduRef, genRef }) {
  adminContainer.innerHTML = "<p>Loading...</p>";

  const [usersSnap, eduSnap, genSnap] = await Promise.all([
    getDocs(collection(db, "users")),
    getDocs(eduRef),
    getDocs(genRef)
  ]);

  const usersById = buildUserMap(usersSnap.docs);
  adminContainer.innerHTML = "<h3>Educational Questions</h3>";

  eduSnap.docs.forEach((docSnap) => {
    const data = docSnap.data();
    renderQuestion(adminContainer, data, usersById.get(data.userId));
  });

  adminContainer.innerHTML += "<h3>General Questions</h3>";
  genSnap.docs.forEach((docSnap) => {
    const data = docSnap.data();
    renderQuestion(adminContainer, data, usersById.get(data.userId));
  });
}
