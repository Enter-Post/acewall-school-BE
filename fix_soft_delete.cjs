const fs = require('fs');
const path = require('path');

// Read the chapter controller file
const filePath = path.join(__dirname, 'src/Contollers/CourseControllers/chapter.controller.js');
let content = fs.readFileSync(filePath, 'utf8');

// Fix 1: Add isDeleted filter for lessons
const lessonsPattern = /pipeline: \[\r\n            {\r\n              \$lookup: {/g;
const lessonsReplacement = `pipeline: [
            {
              $match: { isDeleted: false },
            },
            {
              $lookup: {`;
content = content.replace(lessonsPattern, lessonsReplacement);

// Fix 2: Add isDeleted filter for lesson assessments
const lessonAssessmentsPattern = /\$eq: \[\"\$lesson\", \"\$\$lessonId\"\],\r\n                          { \$eq: \[\"\$type\", \"lesson-assessment\"\] },/g;
const lessonAssessmentsReplacement = `$eq: ["$lesson", "$$lessonId"],
                          { $eq: ["$type", "lesson-assessment"] },
                          { $eq: ["$isDeleted", false] },`;
content = content.replace(lessonAssessmentsPattern, lessonAssessmentsReplacement);

// Fix 3: Add isDeleted filter for chapter assessments
const chapterAssessmentsPattern = /\$eq: \[\"\$chapter\", \"\$\$chapterId\"\],\r\n                    { \$eq: \[\"\$type\", \"chapter-assessment\"\] },/g;
const chapterAssessmentsReplacement = `$eq: ["$chapter", "$$chapterId"],
                    { $eq: ["$type", "chapter-assessment"] },
                    { $eq: ["$isDeleted", false] },`;
content = content.replace(chapterAssessmentsPattern, chapterAssessmentsReplacement);

// Write the fixed content back
fs.writeFileSync(filePath, content, 'utf8');
console.log('Soft delete filters applied successfully to chapter.controller.js');
