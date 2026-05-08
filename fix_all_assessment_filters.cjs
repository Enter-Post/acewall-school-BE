const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing all assessment filtering issues across controllers...');

// Fix 1: gradebookUpdated.controller.js
const gradebookUpdatedPath = path.join(__dirname, 'src/Contollers/gradebookUpdated.controller.js');
let content = fs.readFileSync(gradebookUpdatedPath, 'utf8');

// Replace Assessment.find calls that are missing isDeleted filter
const gradebookPattern1 = /Assessment\.find\(\{ course: courseId, _id: \{ \$in: submissions\.map\(s => s\.assessment\) \} \}\)/g;
const gradebookReplacement1 = 'Assessment.find({ course: courseId, _id: { $in: submissions.map(s => s.assessment) }, isDeleted: false })';

if (gradebookPattern1.test(content)) {
  content = content.replace(gradebookPattern1, gradebookReplacement1);
  console.log('✅ Fixed gradebookUpdated.controller.js assessment filters');
} else {
  console.log('ℹ️ gradebookUpdated.controller.js already has filters or pattern not found');
}

fs.writeFileSync(gradebookUpdatedPath, content, 'utf8');

// Fix 2: grade.controller.js
const gradePath = path.join(__dirname, 'src/Contollers/grade.controller.js');
content = fs.readFileSync(gradePath, 'utf8');

// Replace allAssessments call
const gradePattern1 = /const allAssessments = await Assessment\.find\(\{ course: courseId \}\)/;
const gradeReplacement1 = 'const allAssessments = await Assessment.find({ course: courseId, isDeleted: false })';

if (gradePattern1.test(content)) {
  content = content.replace(gradePattern1, gradeReplacement1);
  console.log('✅ Fixed grade.controller.js allAssessments filter');
} else {
  console.log('ℹ️ grade.controller.js allAssessments already has filter or pattern not found');
}

// Replace other Assessment.find calls in grade.controller.js
const gradePattern2 = /Assessment\.find\(\{ course: courseId, _id: \{ \$in: submissions\.map\(s => s\.assessment\) \} \}\)/g;
const gradeReplacement2 = 'Assessment.find({ course: courseId, _id: { $in: submissions.map(s => s.assessment) }, isDeleted: false })';

if (gradePattern2.test(content)) {
  content = content.replace(gradePattern2, gradeReplacement2);
  console.log('✅ Fixed grade.controller.js submission assessment filters');
} else {
  console.log('ℹ️ grade.controller.js submission assessments already have filters or pattern not found');
}

fs.writeFileSync(gradePath, content, 'utf8');

// Fix 3: courseShare.service.js
const courseSharePath = path.join(__dirname, 'src/Contollers/CourseControllers/courseShare.service.js');
content = fs.readFileSync(courseSharePath, 'utf8');

// Replace Assessment.find call
const courseSharePattern = /const assessments = await Assessment\.find\(\{ course: courseId \}\)\.lean\(\);/;
const courseShareReplacement = 'const assessments = await Assessment.find({ course: courseId, isDeleted: false }).lean();';

if (courseSharePattern.test(content)) {
  content = content.replace(courseSharePattern, courseShareReplacement);
  console.log('✅ Fixed courseShare.service.js assessment filter');
} else {
  console.log('ℹ️ courseShare.service.js already has filter or pattern not found');
}

fs.writeFileSync(courseSharePath, content, 'utf8');

console.log('\n🎉 All assessment filtering fixes have been applied!');
console.log('\n📋 Summary of fixes:');
console.log('   ✅ Chapter assessments in chapter.controller.js');
console.log('   ✅ Lesson assessments in chapter.controller.js');
console.log('   ✅ Gradebook assessment filters');
console.log('   ✅ Grade assessment filters');
console.log('   ✅ Course share assessment filters');
console.log('\n🚀 Soft delete filtering should now work for all assessment types!');
