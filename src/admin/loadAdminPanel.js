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

function safeMillis(timestamp) {
  return timestamp && typeof timestamp.toDate === "function" ? timestamp.toDate().getTime() : 0;
}

function renderReport(container, data) {
  const card = document.createElement("article");
  card.className = "card";
  card.innerHTML = `
    <h4 class="card-title">Report: ${data.targetCollection || "unknown"}/${data.targetId || "unknown"}</h4>
    <p class="meta">Reason: ${data.reason || "N/A"}</p>
    <p class="meta">By: ${data.reportedBy || "N/A"} | Status: ${data.status || "open"}</p>
    <p class="meta">At: ${data.createdAt ? new Date(data.createdAt.toDate()).toLocaleString() : "Just now"}</p>
  `;
  container.appendChild(card);
}

export async function loadAdminPanel({ adminContainer, eduRef, genRef }) {
  adminContainer.innerHTML = "<div class=\"empty\">Loading admin data...</div>";

  const [usersSnap, eduSnap, genSnap, reportsSnap] = await Promise.all([
    getDocs(collection(db, "users")),
    getDocs(eduRef),
    getDocs(genRef),
    getDocs(collection(db, "reports"))
  ]);

  const usersById = buildUserMap(usersSnap.docs);
  adminContainer.innerHTML = "";

  eduSnap.docs.forEach((docSnap) => {
    renderQuestion(adminContainer, docSnap.data(), usersById.get(docSnap.data().userId), "Educational");
  });

  genSnap.docs.forEach((docSnap) => {
    renderQuestion(adminContainer, docSnap.data(), usersById.get(docSnap.data().userId), "General");
  });

  const sortedReports = [...reportsSnap.docs]
    .sort((a, b) => safeMillis(b.data().createdAt) - safeMillis(a.data().createdAt));

  if (sortedReports.length) {
    const reportsHead = document.createElement("h4");
    reportsHead.className = "card-title";
    reportsHead.textContent = "Open Reports";
    adminContainer.appendChild(reportsHead);

    sortedReports.forEach((reportDoc) => {
      renderReport(adminContainer, reportDoc.data());
    });
  }

  if (!eduSnap.docs.length && !genSnap.docs.length && !sortedReports.length) {
    adminContainer.innerHTML = "<div class=\"empty\">No questions available yet.</div>";
  }
}
