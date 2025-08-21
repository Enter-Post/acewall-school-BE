import Assessment from "../Models/Assessment.model.js";
import Submission from "../Models/submission.model.js";

export const getResultsMiddleware = async (req, res, next) => {
  const { assessmentId } = req.params;
  const studentId = req.user._id;

  try {
    const submission = await Submission.findOne({
      studentId,
      assessment: assessmentId,
    });

    if (submission == null) {
      return next();
    }
    console.log(submission, "submission");

    console.log("ab ma chal raha hu");

    const assessment = await Assessment.findById(assessmentId);

    if (!assessment) {
      return res.status(404).json({ message: "Assessment not found" });
    }

    const questionMap = new Map();
    assessment.questions.forEach((q) => {
      questionMap.set(q._id.toString(), q);
    });

    console.log(questionMap, "questionMap");

    const enrichedAnswers = submission.answers.map((answer) => ({
      ...answer.toObject(),
      question: questionMap.get(answer.questionId.toString()),
    }));

    console.log(enrichedAnswers, "enrichedAnswers");

    return res.status(200).json({
      message: "Submission found",
      submission: {
        ...submission.toObject(),
        answers: enrichedAnswers,
      },
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching submission", error: err.message });
  }
};
