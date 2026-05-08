const fs = require('fs');
const path = require('path');

// Read the chapter controller file
const filePath = path.join(__dirname, 'src/Contollers/CourseControllers/chapter.controller.js');
let content = fs.readFileSync(filePath, 'utf8');

console.log('Analyzing assessment filtering in chapter.controller.js...');

// Check current state of chapter assessments filter
const chapterAssessmentPattern = /{ \$eq: \[\"\$chapter\", \"\$\$chapterId\"\],\r\n                    { \$eq: \[\"\$type\", \"chapter-assessment\"\] },/;

if (chapterAssessmentPattern.test(content)) {
  console.log('Found chapter assessments without isDeleted filter - fixing...');
  
  // Fix: Add isDeleted filter for chapter assessments
  const chapterAssessmentReplacement = `{ $eq: ["$chapter", "$$chapterId"],
                    { $eq: ["$type", "chapter-assessment"] },
                    { $eq: ["$isDeleted", false] },`;
  
  content = content.replace(chapterAssessmentPattern, chapterAssessmentReplacement);
  console.log('✅ Added isDeleted filter for chapter assessments');
} else {
  console.log('Chapter assessments already have isDeleted filter or pattern not found');
}

// Also check lesson assessments filter
const lessonAssessmentPattern = /{ \$eq: \[\"\$lesson\", \"\$\$lessonId\"\],\r\n                          { \$eq: \[\"\$type\", \"lesson-assessment\"\] },/;

if (lessonAssessmentPattern.test(content)) {
  console.log('Found lesson assessments without isDeleted filter - fixing...');
  
  // Fix: Add isDeleted filter for lesson assessments  
  const lessonAssessmentReplacement = `$eq: ["$lesson", "$$lessonId"],
                          { $eq: ["$type", "lesson-assessment"] },
                          { $eq: ["$isDeleted", false] },`;
  
  content = content.replace(lessonAssessmentPattern, lessonAssessmentReplacement);
  console.log('✅ Added isDeleted filter for lesson assessments');
} else {
  console.log('Lesson assessments already have isDeleted filter or pattern not found');
}

// Write the fixed content back
fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Assessment filtering fixes applied successfully to chapter.controller.js');

// Also check enrollment controller for student-facing chapter details
const enrollmentFilePath = path.join(__dirname, 'src/Contollers/enrollment.controller.js');
let enrollmentContent = fs.readFileSync(enrollmentFilePath, 'utf8');

console.log('\nAnalyzing assessment filtering in enrollment.controller.js...');

// Check and fix chapter details function
const enrollmentChapterPattern = /{ \$eq: \[\"\$chapter\", \"\$\$chapterId\"\],\r\n                    { \$eq: \[\"\$type\", \"chapter-assessment\"\] },/;

if (enrollmentChapterPattern.test(enrollmentContent)) {
  console.log('Found enrollment chapter assessments without isDeleted filter - fixing...');
  
  const enrollmentChapterReplacement = `{ $eq: ["$chapter", "$$chapterId"],
                    { $eq: ["$type", "chapter-assessment"] },
                    { $eq: ["$isDeleted", false] },`;
  
  enrollmentContent = enrollmentContent.replace(enrollmentChapterPattern, enrollmentChapterReplacement);
  console.log('✅ Added isDeleted filter for enrollment chapter assessments');
} else {
  console.log('Enrollment chapter assessments already have isDeleted filter or pattern not found');
}

// Check and fix lesson assessments in enrollment controller
const enrollmentLessonPattern = /{ \$eq: \[\"\$lesson\", \"\$\$lessonId\"\],\r\n                          { \$eq: \[\"\$type\", \"lesson-assessment\"\] },/;

if (enrollmentLessonPattern.test(enrollmentContent)) {
  console.log('Found enrollment lesson assessments without isDeleted filter - fixing...');
  
  const enrollmentLessonReplacement = `$eq: ["$lesson", "$$lessonId"],
                          { $eq: ["$type", "lesson-assessment"] },
                          { $eq: ["$isDeleted", false] },`;
  
  enrollmentContent = enrollmentContent.replace(enrollmentLessonPattern, enrollmentLessonReplacement);
  console.log('✅ Added isDeleted filter for enrollment lesson assessments');
} else {
  console.log('Enrollment lesson assessments already have isDeleted filter or pattern not found');
}

// Write the fixed enrollment content back
fs.writeFileSync(enrollmentFilePath, enrollmentContent, 'utf8');
console.log('✅ Assessment filtering fixes applied successfully to enrollment.controller.js');

console.log('\n🎉 All assessment filtering issues have been fixed!');
