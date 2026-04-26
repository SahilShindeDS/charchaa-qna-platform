import { renderQuestionCards } from "./questionItems.js";

export function renderSavedPage(dom, combinedQuestions, bookmarks) {
  const savedItems = combinedQuestions.filter((item) => bookmarks.has(item.key));

  renderQuestionCards(
    dom.savedQuestionsList,
    savedItems,
    "No saved questions yet."
  );
}
