import Gradebook from "../Models/Gradebook.model.js";
import GradingScale from "../Models/grading-scale.model.js";
import GPA from "../Models/GPA.model.js";
import StandardGrading from "../Models/StandardGrading.model.js";
import CourseSch from "../Models/courses.model.sch.js";
import User from "../Models/user.model.js";
import AssessmentCategory from "../Models/assessment-category.js";
import Submission from "../Models/submission.model.js";
import DiscussionComment from "../Models/discussionComment.model.js";
import Assessment from "../Models/Assessment.model.js";
import Discussion from "../Models/discussion.model.js";

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




export const getChildGradebookForParent = async (req, res) => {
    try {
        const { studentId } = req.params;
        const parentEmail = req.user.email;

        // 1. AUTHORIZATION CHECK
        // Ensure the student actually belongs to this parent
        const student = await User.findOne({
            _id: studentId,
            guardianEmails: parentEmail,
            role: { $in: ["student", "teacherAsStudent"] }
        });

        if (!student) {
            return res.status(403).json({ 
                success: false, 
                message: "Unauthorized: You do not have access to this student's records." 
            });
        }

        // 2. FETCH GRADING SCALES
        const [gradingScale, gpaScale, standardScale] = await Promise.all([
            GradingScale.findOne({}),
            GPA.findOne({}),
            StandardGrading.findOne({})
        ]);

        // 3. FETCH GRADEBOOKS
        const gradebooks = await Gradebook.find({ studentId });

        if (!gradebooks || gradebooks.length === 0) {
            return res.json({
                studentName: `${student.firstName} ${student.lastName}`,
                totalCourses: 0,
                overallGPA: 0,
                courses: [],
            });
        }

        // 4. FORMATTING LOGIC (Reused from your student API)
        let overallGPA = 0;
        let standardGradesList = [];

        const courses = await Promise.all(
            gradebooks.map(async (gb) => {
                const courseData = await CourseSch.findById(gb.courseId).lean();
                const gradingSystem = courseData?.gradingSystem || "normalGrading";

                const semesters = gb.semesters.map((semester) => {
                    const semesterPercentage = semester.gradePercentage || 0;
                    let semDisplay = {};

                    if (gradingSystem === "normalGrading") {
                        semDisplay.letterGrade = getLetterFromScale(semesterPercentage, gradingScale);
                        semDisplay.gpa = getGPAFromScale(semesterPercentage, gpaScale);
                    } else {
                        semDisplay.standardGrade = getStandardGrade(semesterPercentage, standardScale);
                    }

                    const quarters = semester.quarters.map((quarter) => {
                        const quarterPercentage = quarter.gradePercentage || 0;
                        let quarterDisplay = {};

                        if (gradingSystem === "normalGrading") {
                            quarterDisplay.letterGrade = getLetterFromScale(quarterPercentage, gradingScale);
                            quarterDisplay.gpa = getGPAFromScale(quarterPercentage, gpaScale);
                        } else {
                            quarterDisplay.standardGrade = getStandardGrade(quarterPercentage, standardScale);
                        }

                        return {
                            quarterId: quarter.quarterId,
                            quarterTitle: quarter.quarterTitle,
                            grade: quarterPercentage,
                            ...quarterDisplay,
                            assessments: quarter.items.map(item => ({
                                assessmentId: item.itemId,
                                assessmentTitle: item.title,
                                category: item.categoryName,
                                studentPoints: item.studentPoints,
                                maxPoints: item.maxPoints
                            })),
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

                const coursePercentage = gb.finalPercentage || 0;
                let courseDisplay = {};

                if (gradingSystem === "normalGrading") {
                    courseDisplay.letterGrade = getLetterFromScale(coursePercentage, gradingScale);
                    courseDisplay.gpa = getGPAFromScale(coursePercentage, gpaScale);
                    overallGPA += courseDisplay.gpa;
                } else {
                    courseDisplay.standardGrade = getStandardGrade(coursePercentage, standardScale);
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

        // Calculate Final Totals
        let overallStandardGrade = null;
        if (standardGradesList.length > 0) {
            const avg = standardGradesList.reduce((a, b) => a + b, 0) / standardGradesList.length;
            overallStandardGrade = getStandardGrade(avg, standardScale);
        }

        res.json({
            success: true,
            studentName: `${student.firstName} ${student.lastName}`,
            totalCourses: gradebooks.length,
            overallGPA: Number((overallGPA / gradebooks.length).toFixed(2)),
            overallStandardGrade,
            courses,
        });

    } catch (error) {
        console.error("Error generating parent-view gradebook:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getStudentGradebooksFormattedAnalytics = async (req, res) => {
    try {
        const studentId = req.user._id;

        const gradingScale = await GradingScale.findOne({});
        const gpaScale = await GPA.findOne({});
        const standardScale = await StandardGrading.findOne({});

        const gradebooks = await Gradebook.find({ studentId });

        if (!gradebooks || gradebooks.length === 0) {
            return res.json({ studentId, totalCourses: 0, overallGPA: 0, courses: [] });
        }

        const courses = await Promise.all(
            gradebooks.map(async (gb) => {
                const courseId = gb.courseId;
                
                // 1. Fetch Real-time Category Weights (Same as Teacher API)
                const [categories, courseData, submissions, discussionComments] = await Promise.all([
                    AssessmentCategory.find({ course: courseId }).lean(),
                    CourseSch.findById(courseId).lean().select("courseTitle gradingSystem"),
                    Submission.find({ studentId, graded: true }).lean(),
                    DiscussionComment.find({ createdby: studentId, isGraded: true }).lean()
                ]);

                const subMap = new Map(submissions.map(s => [s.assessment.toString(), s]));
                const discMap = new Map(discussionComments.map(d => [d.discussion.toString(), d]));

                // 2. Fetch Item Details
                const [gradedAssessments, gradedDiscussions] = await Promise.all([
                    Assessment.find({ course: courseId, _id: { $in: submissions.map(s => s.assessment) } }).populate("category").lean(),
                    Discussion.find({ course: courseId, _id: { $in: discussionComments.map(d => d.discussion) } }).populate("category").lean()
                ]);

                // 3. Flatten Items Chronologically
                const allItems = [...gradedAssessments, ...gradedDiscussions].map(item => {
                    let studentPoints = 0, maxPoints = 0, title = "";
                    if (item.questions) {
                        const sub = subMap.get(item._id.toString());
                        studentPoints = sub?.totalScore || 0;
                        maxPoints = item.questions.reduce((sum, q) => sum + q.points, 0);
                        title = item.title;
                    } else {
                        const comm = discMap.get(item._id.toString());
                        studentPoints = comm?.marksObtained || 0;
                        maxPoints = item.totalMarks || 0;
                        title = item.topic;
                    }
                    return {
                        title,
                        categoryId: item.category?._id?.toString(),
                        categoryName: item.category?.name || "Uncategorized",
                        studentPoints,
                        maxPoints,
                        percentage: maxPoints > 0 ? (studentPoints / maxPoints) * 100 : 0,
                        createdAt: item.createdAt || new Date()
                    };
                }).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

                if (allItems.length === 0) return { courseId, courseName: courseData?.courseTitle, analytics: null };

                // 4. Calculate Weighted Average (Matched Logic)
                const categoryStats = {};
                allItems.forEach(item => {
                    if (!categoryStats[item.categoryId]) {
                        const catDoc = categories.find(c => c._id.toString() === item.categoryId);
                        categoryStats[item.categoryId] = { score: 0, max: 0, weight: catDoc?.weight || 0, name: item.categoryName };
                    }
                    categoryStats[item.categoryId].score += item.studentPoints;
                    categoryStats[item.categoryId].max += item.maxPoints;
                });

                const activeCats = Object.values(categoryStats).filter(c => c.max > 0);
                const totalActiveWeight = activeCats.reduce((sum, c) => sum + c.weight, 0);
                
                let coursePercentage = 0;
                activeCats.forEach(cat => {
                    const catPerc = (cat.score / cat.max) * 100;
                    const normalizedWeight = (cat.weight / totalActiveWeight) * 100;
                    coursePercentage += (catPerc * normalizedWeight) / 100;
                });

                // 5. Momentum & Projections
                const recentWindow = 5;
                const trendItems = allItems.slice(-recentWindow);
                const recentAvg = trendItems.reduce((acc, i) => acc + i.percentage, 0) / trendItems.length;
                const trendDiff = recentAvg - coursePercentage;
                const projectedScore = (recentAvg * 0.6) + (coursePercentage * 0.4);

                const categoryPerformance = activeCats.map(cat => ({
                    category: cat.name,
                    average: (cat.score / cat.max) * 100,
                    count: allItems.filter(i => i.categoryName === cat.name).length
                })).sort((a, b) => b.average - a.average);

                const weakest = categoryPerformance[categoryPerformance.length - 1];
                const best = categoryPerformance[0];

                return {
                    courseId,
                    courseName: courseData?.courseTitle,
                    coursePercentage: coursePercentage.toFixed(1),
                    analytics: {
                        trendStatus: trendDiff >= 0 ? "increasing" : "decreasing",
                        percentageChange: Math.abs(trendDiff).toFixed(1),
                        recentAverage: recentAvg.toFixed(1),
                        overallAverage: coursePercentage.toFixed(1),
                        projectedFinalScore: Math.min(100, projectedScore).toFixed(1),
                        sampleSize: trendItems.length,
                        weakestCategory: weakest ? { name: weakest.category, average: weakest.average.toFixed(1), gap: (best.average - weakest.average).toFixed(1) } : null,
                        chartData: {
                            lineChart: allItems.map(i => ({ name: i.title, score: i.percentage.toFixed(1) })),
                            categoryPerformance
                        }
                    }
                };
            })
        );

        return res.json({ studentId, totalCourses: gradebooks.length, courses });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

export const getChildCourseAnalyticsForParent = async (req, res) => {
    try {
        const { studentId, courseId } = req.params;
        const parentEmail = req.user.email;

        // 1. AUTHORIZATION CHECK
        const student = await User.findOne({
            _id: studentId,
            guardianEmails: parentEmail,
        });

        if (!student) {
            return res.status(403).json({ 
                success: false, 
                message: "Unauthorized: Access to this student's analytics is denied." 
            });
        }

        // 2. FETCH REAL-TIME DATA (Same as Teacher/Student synced logic)
        const [categories, course, submissions, discussionComments] = await Promise.all([
            AssessmentCategory.find({ course: courseId }).lean(),
            CourseSch.findById(courseId).lean().select("courseTitle"),
            Submission.find({ studentId, graded: true }).lean(),
            DiscussionComment.find({ createdby: studentId, isGraded: true }).lean()
        ]);

        if (!course) {
            return res.status(404).json({ message: "Analytics data not found." });
        }

        const subMap = new Map(submissions.map(s => [s.assessment.toString(), s]));
        const discMap = new Map(discussionComments.map(d => [d.discussion.toString(), d]));

        // 3. FETCH ITEM DETAILS
        const [gradedAssessments, gradedDiscussions] = await Promise.all([
            Assessment.find({ course: courseId, _id: { $in: submissions.map(s => s.assessment) } }).populate("category").lean(),
            Discussion.find({ course: courseId, _id: { $in: discussionComments.map(d => d.discussion) } }).populate("category").lean()
        ]);

        // 4. FORMAT ITEMS CHRONOLOGICALLY
        const allItems = [...gradedAssessments, ...gradedDiscussions].map(item => {
            let studentPoints = 0, maxPoints = 0, title = "";
            if (item.questions) {
                const sub = subMap.get(item._id.toString());
                studentPoints = sub?.totalScore || 0;
                maxPoints = item.questions.reduce((sum, q) => sum + q.points, 0);
                title = item.title;
            } else {
                const comm = discMap.get(item._id.toString());
                studentPoints = comm?.marksObtained || 0;
                maxPoints = item.totalMarks || 0;
                title = item.topic;
            }
            return {
                title,
                categoryId: item.category?._id?.toString(),
                categoryName: item.category?.name || "Uncategorized",
                studentPoints,
                maxPoints,
                percentage: maxPoints > 0 ? (studentPoints / maxPoints) * 100 : 0,
                createdAt: item.createdAt || new Date()
            };
        }).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        if (allItems.length === 0) {
            return res.json({ success: true, message: "No graded items found.", summary: { currentPercentage: 0 }, insights: null });
        }

        // 5. CALCULATE WEIGHTED AVERAGE (Matching logic across all portals)
        const categoryStats = {};
        allItems.forEach(item => {
            if (!categoryStats[item.categoryId]) {
                const catDoc = categories.find(c => c._id.toString() === item.categoryId);
                categoryStats[item.categoryId] = { score: 0, max: 0, weight: catDoc?.weight || 0, name: item.categoryName };
            }
            categoryStats[item.categoryId].score += item.studentPoints;
            categoryStats[item.categoryId].max += item.maxPoints;
        });

        const activeCats = Object.values(categoryStats).filter(c => c.max > 0);
        const totalActiveWeight = activeCats.reduce((sum, c) => sum + c.weight, 0);
        
        let currentOverallAvg = 0;
        activeCats.forEach(cat => {
            const catPerc = (cat.score / cat.max) * 100;
            const normalizedWeight = (cat.weight / totalActiveWeight) * 100;
            currentOverallAvg += (catPerc * normalizedWeight) / 100;
        });

        // 6. MOMENTUM & PROJECTION
        const recentWindow = 5;
        const trendItems = allItems.slice(-recentWindow);
        const recentAvg = trendItems.reduce((acc, i) => acc + i.percentage, 0) / trendItems.length;
        const trendDiff = recentAvg - currentOverallAvg;
        const projectedScore = (recentAvg * 0.6) + (currentOverallAvg * 0.4);

        const categoryPerformance = activeCats.map(cat => ({
            category: cat.name,
            average: (cat.score / cat.max) * 100,
            count: allItems.filter(i => i.categoryId === cat.categoryId).length
        })).sort((a, b) => b.average - a.average);

        const weakest = categoryPerformance[categoryPerformance.length - 1];
        const best = categoryPerformance[0];

        // 7. RESPONSE
        res.json({
            success: true,
            studentName: `${student.firstName} ${student.lastName}`,
            courseName: course.courseTitle,
            summary: {
                currentPercentage: currentOverallAvg.toFixed(1),
                totalAssessments: allItems.length,
            },
            insights: {
                trendStatus: trendDiff >= 0 ? "increasing" : "decreasing",
                percentageChange: Math.abs(trendDiff).toFixed(1),
                recentAverage: recentAvg.toFixed(1),
                overallAverage: currentOverallAvg.toFixed(1),
                projectedFinalScore: Math.min(100, projectedScore).toFixed(1),
                sampleSize: trendItems.length,
                weakestCategory: weakest ? { 
                    category: weakest.category, 
                    average: weakest.average.toFixed(1), 
                    gap: (best.average - weakest.average).toFixed(1) 
                } : null
            },
            charts: {
                lineChart: allItems.map(i => ({ name: i.title, score: i.percentage.toFixed(1) })),
                categoryPerformance
            }
        });

    } catch (error) {
        console.error("Parent Sync Analytics Error:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
};