import { renderQuestionCards } from "./questionItems.js";

export function renderMyActivityPage(dom, combinedQuestions, currentUser) {
  const myItems = currentUser
    ? combinedQuestions.filter((item) => item.userId === currentUser.uid)
    : [];

  renderQuestionCards(
    dom.myActivityList,
    myItems,
    currentUser ? "You have not posted yet." : "Login to view your activity."
  );

  return myItems.length;
}
