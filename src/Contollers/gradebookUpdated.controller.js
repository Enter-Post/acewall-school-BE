import Gradebook from "../Models/Gradebook.model.js";
import GradingScale from "../Models/grading-scale.model.js";
import GPA from "../Models/GPA.model.js";
import StandardGrading from "../Models/StandardGrading.model.js";
import CourseSch from "../Models/courses.model.sch.js";
import User from "../Models/user.model.js";

// ======================================================
// 🔥 Helper Methods
// ======================================================
function getLetterFromScale(percent, gradingScale) {
    if (!gradingScale || !gradingScale.scale) return "N/A";

    const match = gradingScale.scale.find(
        (s) => percent >= s.min && percent <= s.max
    );

    if (!match) return "N/A";

    // If "letter" is missing, fallback to "grade"
    return match.letter && match.letter.trim() !== ""
        ? match.letter
        : match.grade || "N/A";
}

function getGPAFromScale(percent, gpaScale) {
    if (!gpaScale || !gpaScale.gpaScale) return 0;

    const match = gpaScale.gpaScale.find(
        (g) => percent >= g.minPercentage && percent <= g.maxPercentage
    );

    return match ? match.gpa : 0;
}

function getStandardGrade(percent, standardScale) {
    if (!standardScale || !standardScale.scale)
        return { grade: null, remark: null };

    const match = standardScale.scale.find(
        (s) => percent >= s.minPercentage && percent <= s.maxPercentage
    );

    return match
        ? { grade: match.points, remark: match.remarks }
        : { grade: null, remark: null };
}

export const getStudentGradebooksFormatted = async (req, res) => {
    try {
        const studentId = req.user._id;

        const gradingScale = await GradingScale.findOne({});
        const gpaScale = await GPA.findOne({});
        const standardScale = await StandardGrading.findOne({});

        const gradebooks = await Gradebook.find({ studentId });

        if (!gradebooks || gradebooks.length === 0) {
            return res.json({
                studentId,
                totalCourses: 0,
                overallGPA: 0,
                overallStandardGrade: null,
                courses: [],
            });
        }

        let totalCourses = gradebooks.length;
        let overallGPA = 0;
        let standardGradesList = [];

        const courses = await Promise.all(
            gradebooks.map(async (gb) => {
                const courseData = await CourseSch.findById(gb.courseId).lean();
                const gradingSystem = courseData?.gradingSystem || "normalGrading";

                // ---------------------- SEMESTERS ----------------------
                const semesters = gb.semesters.map((semester) => {
                    const semesterPercentage = semester.gradePercentage || 0;

                    let semDisplay = {};
                    if (gradingSystem === "normalGrading") {
                        semDisplay.letterGrade = getLetterFromScale(
                            semesterPercentage,
                            gradingScale
                        );
                        semDisplay.gpa = getGPAFromScale(semesterPercentage, gpaScale);
                    } else {
                        semDisplay.standardGrade = getStandardGrade(
                            semesterPercentage,
                            standardScale
                        );
                    }

                    // ---------------------- QUARTERS ----------------------
                    const quarters = semester.quarters.map((quarter) => {
                        const quarterPercentage = quarter.gradePercentage || 0;

                        let quarterDisplay = {};
                        if (gradingSystem === "normalGrading") {
                            quarterDisplay.letterGrade = getLetterFromScale(
                                quarterPercentage,
                                gradingScale
                            );
                            quarterDisplay.gpa = getGPAFromScale(
                                quarterPercentage,
                                gpaScale
                            );
                        } else {
                            quarterDisplay.standardGrade = getStandardGrade(
                                quarterPercentage,
                                standardScale
                            );
                        }

                        const assessments = quarter.items.map((item) => {
                            const isDiscussion =
                                item.itemType?.toLowerCase() === "discussion" ||
                                item.categoryName?.toLowerCase() === "discussion" ||
                                item.isDiscussion === true;

                            return {
                                assessmentId: item.itemId,
                                assessmentTitle: item.title,
                                category: item.categoryName,
                                isDiscussion,
                                isGraded: true,
                                maxPoints: item.maxPoints,
                                studentPoints: item.studentPoints,
                            };
                        });

                        return {
                            quarterId: quarter.quarterId,
                            quarterTitle: quarter.quarterTitle,
                            grade: quarterPercentage,
                            ...quarterDisplay,
                            assessments,
                        };
                    });

                    return {
                        semesterId: semester.semesterId,
                        semesterTitle: semester.semesterTitle,
                        semesterPercentage,
                        ...semDisplay,
                        quarters,
                    };
                });

                // ---------------------- COURSE ----------------------
                const coursePercentage = gb.finalPercentage || 0;
                let courseDisplay = {};

                if (gradingSystem === "normalGrading") {
                    courseDisplay.letterGrade = getLetterFromScale(
                        coursePercentage,
                        gradingScale
                    );
                    courseDisplay.gpa = getGPAFromScale(coursePercentage, gpaScale);
                    overallGPA += courseDisplay.gpa;
                } else {
                    const standardGrade = getStandardGrade(coursePercentage, standardScale);
                    courseDisplay.standardGrade = standardGrade;
                    standardGradesList.push(coursePercentage);
                }

                return {
                    courseId: gb.courseId,
                    courseName: courseData?.courseTitle || gb.courseTitle || "N/A",
                    coursePercentage,
                    ...courseDisplay,
                    semesters,
                    gradingSystem,
                };
            })
        );

        // ---------------------- OVERALL ----------------------
        let overallStandardGrade = null;

        if (standardGradesList.length > 0) {
            // Average the final percentages of standard grading courses
            const overallPercentage =
                standardGradesList.reduce((a, b) => a + b, 0) /
                standardGradesList.length;

            overallStandardGrade = getStandardGrade(overallPercentage, standardScale);
        }

        return res.json({
            studentId,
            totalCourses,
            overallGPA: Number((overallGPA / totalCourses).toFixed(2)),
            overallStandardGrade, // new field for standard grading
            currentPage: 1,
            totalPages: 1,
            courses,
        });
    } catch (error) {
        console.error("Error generating gradebook:", error);
        return res.status(500).json({ error: error.message });
    }
};


export const getGradebooksOfCourseFormatted = async (req, res) => {
    const courseId = req.params.courseId;

    try {
        // Fetch course
        const course = await CourseSch.findById(courseId);
        if (!course)
            return res.status(404).json({ message: "Course not found" });

        const gradingType = course.gradingSystem;

        // Fetch all scales at once
        const gradingScale = await GradingScale.findOne({});
        const gpaScale = await GPA.findOne({});
        const standardScale = await StandardGrading.findOne({});

        // Fetch gradebooks
        const gradebooks = await Gradebook.find({ courseId })
            .populate("studentId", "firstName lastName");

        const formatted = [];

        for (const gb of gradebooks) {
            const studentName = gb.studentId
                ? `${gb.studentId.firstName} ${gb.studentId.lastName}`
                : "Unknown";

            // ----------------------------
            // Final Course Grade Assignment
            // ----------------------------
            let finalBlock = {};

            if (gradingType === "normalGrading") {
                const percent = gb.finalPercentage ?? 0;

                finalBlock = {
                    finalGrade: percent,
                    gpa: getGPAFromScale(percent, gpaScale),
                    letterGrade: getLetterFromScale(percent, gradingScale),
                };
            } else {
                // ⭐ Standard-Based
                const percent = gb.finalPercentage ?? 0;
                const sg = getStandardGrade(percent, standardScale);

                finalBlock = {
                    standardGrade: {
                        finalGrade: percent,
                        points: sg.grade ?? 0,
                        remarks: sg.remark ?? "",
                    },
                };
            }

            // -----------------------------------
            // SEMESTERS + QUARTERS + ITEMS FORMAT
            // -----------------------------------
            const semesters = (gb.semesters || []).map(sem => {
                const percent = sem.gradePercentage ?? 0;

                return {
                    semesterId: sem.semesterId,
                    semesterTitle: sem.semesterTitle,

                    ...(gradingType === "normalGrading" && {
                        grade: percent,
                        letterGrade: getLetterFromScale(percent, gradingScale),
                    }),

                    ...(gradingType === "StandardGrading" && (() => {
                        const sg = getStandardGrade(percent, standardScale);
                        return {
                            standardGrade: {
                                grade: percent,
                                points: sg.grade ?? 0,
                                remarks: sg.remark ?? ""
                            }
                        };
                    })()),

                    quarters: (sem.quarters || []).map(qt => {
                        const qPercent = qt.gradePercentage ?? 0;

                        return {
                            quarterId: qt.quarterId,
                            quarterTitle: qt.quarterTitle,

                            ...(gradingType === "normalGrading" && {
                                grade: qPercent,
                                gpa: getGPAFromScale(qPercent, gpaScale),
                                letterGrade: getLetterFromScale(qPercent, gradingScale),
                            }),

                            ...(gradingType === "StandardGrading" && (() => {
                                const sg = getStandardGrade(qPercent, standardScale);
                                return {
                                    standardGrade: {
                                        grade: qPercent,
                                        points: sg.grade ?? 0,
                                        remarks: sg.remark ?? ""
                                    }
                                };
                            })()),

                            assessments: (qt.items || []).map(item => ({
                                assessmentId: item.itemId,
                                assessmentTitle: item.title,
                                category: item.categoryName,
                                isDiscussion: item.itemType === "discussion",
                                maxPoints: item.maxPoints,
                                studentPoints: item.studentPoints,
                            }))
                        };
                    })
                };
            });

            // FINAL OUTPUT
            formatted.push({
                studentId: gb.studentId?._id,
                studentName,
                semesters,
                ...finalBlock,
            });
        }

        return res.status(200).json({ gradebook: formatted, gradingSystem: gradingType });

    } catch (error) {
        console.error("Error in getGradebooksOfCourseFormatted", error);
        return res.status(500).json({ error: error.message });
    }
};


export const getGradebooksOfStudentCourseFormatted = async (req, res) => {
    try {
        
    } catch (error) {
        console.error("Error in getGradebooksOfStudentCourseFormatted", error);
        return res.status(500).json({ error: error.message });
    }
}
