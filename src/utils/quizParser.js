/**
 * Parses the agent's text response to check for quiz tags.
 * Format expected:
 * ... some introductory text ...
 * [QUIZ_QUESTION]Which of the following is correct?[/QUIZ_QUESTION]
 * [OPTIONS]Option A|Option B|Option C[/OPTIONS]
 * 
 * @param {string} text 
 * @returns {object} { hasQuiz: boolean, cleanText: string, question: string|null, options: string[] }
 */
export function parseAgentResponse(text) {
  if (!text) {
    return { hasQuiz: false, cleanText: "", question: null, options: [] };
  }

  const questionRegex = /\[QUIZ_QUESTION\]([\s\S]*?)\[\/QUIZ_QUESTION\]/;
  const optionsRegex = /\[OPTIONS\]([\s\S]*?)\[\/OPTIONS\]/;

  const questionMatch = text.match(questionRegex);
  const optionsMatch = text.match(optionsRegex);

  if (questionMatch && optionsMatch) {
    const question = questionMatch[1].trim();
    const optionsRaw = optionsMatch[1].trim();
    const options = optionsRaw.split("|").map(opt => opt.trim()).filter(opt => opt.length > 0);
    
    // Clean up the text by removing the tags and their contents
    let cleanText = text
      .replace(questionRegex, "")
      .replace(optionsRegex, "")
      .trim();

    return {
      hasQuiz: true,
      cleanText: cleanText,
      question: question,
      options: options
    };
  }

  return {
    hasQuiz: false,
    cleanText: text.trim(),
    question: null,
    options: []
  };
}
