import {
  auth,
  db,
  collection,
  addDoc,
  query,
  orderBy,
  serverTimestamp,
  onSnapshot
} from "../firebase/client.js";

function renderAnswer(answerSection, answerText) {
  const answerDiv = document.createElement("div");
  answerDiv.style.borderTop = "1px dashed #ccc";
  answerDiv.style.marginTop = "5px";
  answerDiv.style.paddingTop = "5px";
  answerDiv.textContent = answerText;
  answerSection.appendChild(answerDiv);
}

function setupAnswerSubmission({ categoryCollection, questionId, answerInput }) {
  return async () => {
    const user = auth.currentUser;
    if (!user) {
      alert("Login to answer!");
      return;
    }

    const answer = answerInput.value.trim();
    if (!answer) {
      alert("Enter an answer!");
      return;
    }

    await addDoc(collection(db, categoryCollection, questionId, "answers"), {
      answer,
      userId: user.uid,
      timestamp: serverTimestamp()
    });

    answerInput.value = "";
  };
}

function watchAnswers({ categoryCollection, questionId, answerSection }) {
  const answersRef = collection(db, categoryCollection, questionId, "answers");
  const answersQuery = query(answersRef, orderBy("timestamp", "asc"));

  onSnapshot(answersQuery, (snapshot) => {
    answerSection.innerHTML = "";
    snapshot.forEach((answerDoc) => {
      const data = answerDoc.data();
      renderAnswer(answerSection, data.answer);
    });
  });
}

function renderQuestionCard({ listEl, categoryCollection, questionDoc }) {
  const data = questionDoc.data();
  const questionDiv = document.createElement("div");
  questionDiv.className = "card";
  questionDiv.innerHTML = `
    ${data.question}
    <div class="timestamp">Posted on: ${data.timestamp ? new Date(data.timestamp.toDate()).toLocaleString() : "Just now"}</div>
    <div class="answer-section"></div>
    <div class="answer-input">
      <textarea placeholder="Write your answer..."></textarea>
      <button>Submit</button>
    </div>
  `;

  const answerInput = questionDiv.querySelector("textarea");
  const answerButton = questionDiv.querySelector("button");
  const answerSection = questionDiv.querySelector(".answer-section");

  answerButton.onclick = setupAnswerSubmission({
    categoryCollection,
    questionId: questionDoc.id,
    answerInput
  });

  watchAnswers({
    categoryCollection,
    questionId: questionDoc.id,
    answerSection
  });

  listEl.appendChild(questionDiv);
}

export function initQuestionSection({ formEl, inputEl, listEl, categoryCollection }) {
  const categoryRef = collection(db, categoryCollection);

  formEl.addEventListener("submit", async (event) => {
    event.preventDefault();
    const question = inputEl.value.trim();
    const user = auth.currentUser;

    if (!question) {
      alert("Enter a question!");
      return;
    }

    if (!user) {
      alert("Login to submit a question.");
      return;
    }

    await addDoc(categoryRef, {
      question,
      userId: user.uid,
      timestamp: serverTimestamp()
    });

    inputEl.value = "";
  });

  const questionsQuery = query(categoryRef, orderBy("timestamp", "desc"));
  onSnapshot(questionsQuery, (snapshot) => {
    listEl.innerHTML = "";
    snapshot.forEach((questionDoc) => {
      renderQuestionCard({ listEl, categoryCollection, questionDoc });
    });
  });

  return categoryRef;
}
