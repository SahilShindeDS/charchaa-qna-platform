function toMillis(timestamp) {
  return timestamp && typeof timestamp.toDate === "function" ? timestamp.toDate().getTime() : 0;
}

function formatTimestamp(timestamp) {
  return toMillis(timestamp) ? new Date(timestamp.toDate()).toLocaleString() : "Just now";
}

export function buildCombinedQuestions(eduDocs, genDocs) {
  const decorate = (docs, category) => docs.map((docSnap) => ({
    id: docSnap.id,
    category,
    key: `${category}:${docSnap.id}`,
    ...docSnap.data()
  }));

  return [...decorate(eduDocs, "educationalQuestions"), ...decorate(genDocs, "generalQuestions")]
    .sort((a, b) => toMillis(b.timestamp) - toMillis(a.timestamp));
}

export function renderQuestionCards(container, items, emptyLabel) {
  container.innerHTML = "";

  if (!items.length) {
    container.innerHTML = `<div class="empty">${emptyLabel}</div>`;
    return;
  }

  items.forEach((item) => {
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <div class="card-head">
        <h4 class="card-title">${item.question}</h4>
        <span class="meta">${formatTimestamp(item.timestamp)}</span>
      </div>
      <div class="tag-row">
        <span class="tag">${item.category === "educationalQuestions" ? "Educational" : "General"}</span>
      </div>
    `;
    container.appendChild(card);
  });
}
