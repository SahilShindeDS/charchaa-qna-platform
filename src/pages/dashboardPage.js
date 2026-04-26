import { renderQuestionCards } from "./questionItems.js";

export function renderDashboardPage(dom, combinedQuestions) {
  renderQuestionCards(
    dom.dashboardFeed,
    combinedQuestions.slice(0, 8),
    "No questions posted yet."
  );
}
