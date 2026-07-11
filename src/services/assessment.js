// LearnMate Local Assessment Engine
// Handles the entire skill assessment flow client-side.
// Only uses local roadmap data — no AI calls needed for quiz/assessment.

import { TRACKS, getRoadmap, isKnownTrack } from "../data/roadmaps";

const STAGE_ORDER = ["Beginner", "Intermediate", "Advanced"];

/**
 * Generates the initial greeting message when a new track is created.
 * This is fully local — no AI call needed.
 */
export function generateGreeting(trackName) {
  if (!isKnownTrack(trackName)) {
    const available = Object.keys(TRACKS).join(", ");
    return `👋 Hey there! Unfortunately, the track **"${trackName}"** isn't available yet.\n\nHere are the tracks I currently support:\n- ${Object.keys(TRACKS).join("\n- ")}\n\nPlease create a new track with one of these names and I'll get you started!`;
  }

  const stageData = getRoadmap(trackName, "Beginner");
  const firstQuestion = stageData.assessmentQuestions[0];

  return `👋 Welcome to your **${trackName}** learning path!\n\nBefore we build your roadmap, I need to figure out where you stand. I'll ask you a few quick yes/no questions to determine your skill level.\n\nLet's start with the basics:\n\n[QUIZ_QUESTION]${firstQuestion}[/QUIZ_QUESTION]\n[OPTIONS]Yes|No[/OPTIONS]`;
}

/**
 * Assessment state object structure:
 * {
 *   phase: "assessment" | "completed",
 *   currentStage: "Beginner" | "Intermediate" | "Advanced",
 *   currentQuestionIndex: number,
 *   answers: { Beginner: boolean[], Intermediate: boolean[], Advanced: boolean[] },
 *   determinedLevel: string | null
 * }
 */

/**
 * Creates a fresh assessment state for a new track.
 */
export function createAssessmentState() {
  return {
    phase: "assessment",
    currentStage: "Beginner",
    currentQuestionIndex: 0,
    answers: { Beginner: [], Intermediate: [], Advanced: [] },
    determinedLevel: null
  };
}

/**
 * Extracts assessment state from a track's existing data.
 * If the track has no assessment state, creates a new one.
 */
export function getAssessmentState(track) {
  if (track.assessment) {
    return track.assessment;
  }
  return createAssessmentState();
}

/**
 * Determines if the user's answer is "yes" based on their message text.
 */
function isYesAnswer(text) {
  const normalized = text.toLowerCase().trim();
  return ["yes", "y", "yeah", "yep", "yup", "sure", "definitely", "of course", "absolutely", "yes!"].includes(normalized);
}

/**
 * Counts "yes" answers for a given stage.
 */
function countYesAnswers(answers) {
  return answers.filter(Boolean).length;
}

/**
 * Formats the roadmap presentation for a determined stage.
 */
function formatRoadmap(trackName, stage) {
  const data = getRoadmap(trackName, stage);
  if (!data) return "Roadmap data not found.";

  let text = `🎯 **Assessment Complete!**\n\n`;
  text += `Based on your answers, I've placed you at the **${stage}** level.\n\n`;
  text += `---\n\n`;
  text += `**Track:** ${trackName}\n`;
  text += `**Current Stage:** ${stage}\n\n`;
  text += `**📚 Topics to focus on:**\n`;
  data.topics.forEach((topic) => {
    text += `- ${topic}\n`;
  });
  text += `\n**🔗 Recommended resources:**\n`;
  data.resources.forEach((resource) => {
    text += `- ${resource}\n`;
  });
  text += `\n**🏗️ Milestone project:**\n${data.milestoneProject}\n\n`;
  text += `---\n\n`;
  text += `Once you've completed the milestone project, let me know and I'll move you to the next stage! You can also ask me any questions about these topics — I'm here to help. 💪`;

  return text;
}

/**
 * Processes a user's message during assessment.
 * Returns: { responseText: string, updatedAssessment: object, determinedStage: string | null }
 * 
 * - determinedStage is non-null when assessment completes (use to update track.stage)
 * - responseText is the agent's next message (quiz question or roadmap)
 * - updatedAssessment is the new assessment state to store on the track
 */
export function processAssessmentAnswer(trackName, assessment, userMessageText) {
  if (!isKnownTrack(trackName) || assessment.phase === "completed") {
    return {
      responseText: null, // Signal to use AI instead
      updatedAssessment: assessment,
      determinedStage: null
    };
  }

  const track = TRACKS[trackName];
  const currentStageData = track.stages[assessment.currentStage];
  const questions = currentStageData.assessmentQuestions;

  // Record the answer
  const isYes = isYesAnswer(userMessageText);
  const updatedAnswers = { ...assessment.answers };
  updatedAnswers[assessment.currentStage] = [...(updatedAnswers[assessment.currentStage] || []), isYes];

  const currentAnswers = updatedAnswers[assessment.currentStage];
  const questionsDone = currentAnswers.length;
  const totalQuestions = questions.length;

  // Still have more questions in this stage
  if (questionsDone < totalQuestions) {
    const nextQuestion = questions[questionsDone];
    const ackText = isYes ? "Great, got it! ✅" : "No worries! 👍";
    const questionNum = questionsDone + 1;

    const responseText = `${ackText}\n\nQuestion ${questionNum} of ${totalQuestions}:\n\n[QUIZ_QUESTION]${nextQuestion}[/QUIZ_QUESTION]\n[OPTIONS]Yes|No[/OPTIONS]`;

    return {
      responseText,
      updatedAssessment: {
        ...assessment,
        currentQuestionIndex: questionsDone,
        answers: updatedAnswers
      },
      determinedStage: null
    };
  }

  // All questions for this stage are done — evaluate
  const yesCount = countYesAnswers(currentAnswers);
  const passedStage = yesCount >= 3; // 3 or 4 out of 4 = pass

  if (passedStage) {
    // Check if there's a higher stage to test
    const currentIdx = STAGE_ORDER.indexOf(assessment.currentStage);
    const nextStageIdx = currentIdx + 1;

    if (nextStageIdx < STAGE_ORDER.length) {
      // Move to next stage assessment
      const nextStage = STAGE_ORDER[nextStageIdx];
      const nextStageData = track.stages[nextStage];
      const firstQuestion = nextStageData.assessmentQuestions[0];

      const responseText = `You answered **${yesCount}/4** yes on the ${assessment.currentStage} questions — nice! 🎉\n\nLet me check if you're ready for **${nextStage}** level:\n\n[QUIZ_QUESTION]${firstQuestion}[/QUIZ_QUESTION]\n[OPTIONS]Yes|No[/OPTIONS]`;

      return {
        responseText,
        updatedAssessment: {
          ...assessment,
          currentStage: nextStage,
          currentQuestionIndex: 0,
          answers: updatedAnswers
        },
        determinedStage: null
      };
    } else {
      // Passed all stages — they're Advanced
      const responseText = formatRoadmap(trackName, "Advanced");
      return {
        responseText,
        updatedAssessment: {
          ...assessment,
          phase: "completed",
          determinedLevel: "Advanced",
          answers: updatedAnswers
        },
        determinedStage: "Advanced"
      };
    }
  } else {
    // Didn't pass this stage — this is their level
    const stage = assessment.currentStage;
    const responseText = formatRoadmap(trackName, stage);
    return {
      responseText,
      updatedAssessment: {
        ...assessment,
        phase: "completed",
        determinedLevel: stage,
        answers: updatedAnswers
      },
      determinedStage: stage
    };
  }
}

/**
 * Checks if the assessment is still in progress for a track.
 */
export function isAssessmentInProgress(assessment) {
  return assessment && assessment.phase === "assessment";
}

/**
 * Checks if a track is a known/supported track.
 */
export { isKnownTrack };
