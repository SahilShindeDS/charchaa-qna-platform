import { db, collection, getDocs } from "../firebase/client.js";

function buildUserMap(userDocs) {
  const users = new Map();
  userDocs.forEach((docSnap) => {
    users.set(docSnap.id, docSnap.data());
  });
  return users;
}

function renderQuestion(container, data, userInfo, label) {
  const card = document.createElement("article");
  card.className = "card";
  card.innerHTML = `
    <h4 class="card-title">${data.question}</h4>
    <p class="meta">${label} | User: ${userInfo?.name || data.userId} | Email: ${userInfo?.email || "N/A"}</p>
    <p class="meta">Posted: ${data.timestamp ? new Date(data.timestamp.toDate()).toLocaleString() : "Just now"}</p>
  `;
  container.appendChild(card);
}

export async function loadAdminPanel({ adminContainer, eduRef, genRef }) {
  adminContainer.innerHTML = "<div class=\"empty\">Loading admin data...</div>";

  const [usersSnap, eduSnap, genSnap] = await Promise.all([
    getDocs(collection(db, "users")),
    getDocs(eduRef),
    getDocs(genRef)
  ]);

  const usersById = buildUserMap(usersSnap.docs);
  adminContainer.innerHTML = "";

  eduSnap.docs.forEach((docSnap) => {
    renderQuestion(adminContainer, docSnap.data(), usersById.get(docSnap.data().userId), "Educational");
  });

  genSnap.docs.forEach((docSnap) => {
    renderQuestion(adminContainer, docSnap.data(), usersById.get(docSnap.data().userId), "General");
  });

  if (!eduSnap.docs.length && !genSnap.docs.length) {
    adminContainer.innerHTML = "<div class=\"empty\">No questions available yet.</div>";
  }
}
