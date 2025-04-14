import { QCM_ANSWERS } from "../config/qcm";

export const findAnswer = (question: string): string | null => {
  try {
    if (!question) return null;

    // Try exact match first
    if (QCM_ANSWERS[question]) {
      return QCM_ANSWERS[question];
    }

    // Try case-insensitive match
    const normalizedQuestion = question.toLowerCase().trim();
    const keys = Object.keys(QCM_ANSWERS);

    for (const key of keys) {
      if (key.toLowerCase().trim() === normalizedQuestion) {
        return QCM_ANSWERS[key];
      }
    }

    return null;
  } catch (error) {
    console.error("Error finding QCM answer:", error);
    return null;
  }
};

export const addAnswer = (question: string, answer: string): boolean => {
  try {
    if (!question || !answer) return false;

    QCM_ANSWERS[question] = answer;
    return true;
  } catch (error) {
    console.error("Error adding QCM answer:", error);
    return false;
  }
};
