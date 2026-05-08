const fs = require('fs');
const path = require('path');

// Read the chapter controller file
const filePath = path.join(__dirname, 'src/Contollers/CourseControllers/chapter.controller.js');
let content = fs.readFileSync(filePath, 'utf8');

console.log('Fixing chapter assessments isDeleted filter...');

// The exact pattern we need to fix for chapter assessments
const chapterAssessmentPattern = /{ \$eq: \[\"\$chapter\", \"\$\$chapterId\"\],\r\n                    { \$eq: \[\"\$type\", \"chapter-assessment\"\] },\r\n                  ],/;

// The replacement with isDeleted filter
const chapterAssessmentReplacement = `{ $eq: ["$chapter", "$$chapterId"],
                    { $eq: ["$type", "chapter-assessment"] },
                    { $eq: ["$isDeleted", false] },
                  ],`;

if (chapterAssessmentPattern.test(content)) {
  content = content.replace(chapterAssessmentPattern, chapterAssessmentReplacement);
  console.log('✅ Fixed chapter assessments isDeleted filter');
} else {
  console.log('❌ Chapter assessment pattern not found - checking alternative patterns...');
  
  // Try alternative pattern
  const altPattern = /\$eq: \[\"\$chapter\", \"\$\$chapterId\"\],\r\n                    \{ \$eq: \[\"\$type\", \"chapter-assessment\"\] \},\r\n                  \],/;
  const altReplacement = `$eq: ["$chapter", "$$chapterId"],
                    { $eq: ["$type", "chapter-assessment"] },
                    { $eq: ["$isDeleted", false] },
                  ],`;
  
  if (altPattern.test(content)) {
    content = content.replace(altPattern, altReplacement);
    console.log('✅ Fixed chapter assessments isDeleted filter (alternative pattern)');
  } else {
    console.log('❌ Still no pattern found - using manual string replacement...');
    
    // Manual approach - find the specific line and add the filter
    const lines = content.split('\n');
    let found = false;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('{ $eq: ["$type", "chapter-assessment"] },')) {
        // Insert the isDeleted line after this line
        lines.splice(i + 1, 0, '                    { $eq: ["$isDeleted", false] },');
        found = true;
        console.log('✅ Manually inserted chapter assessments isDeleted filter');
        break;
      }
    }
    
    if (!found) {
      console.log('❌ Could not find chapter assessment line to fix');
    } else {
      content = lines.join('\n');
    }
  }
}

// Write the fixed content back
fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Chapter assessments fix applied successfully');

// Also check if lesson assessments need fixing
const lessonAssessmentPattern = /\$eq: \[\"\$lesson\", \"\$\$lessonId\"\],\r\n                          { \$eq: \[\"\$type\", \"lesson-assessment\"\] },\r\n                        ],/;

if (lessonAssessmentPattern.test(content)) {
  const lessonReplacement = `$eq: ["$lesson", "$$lessonId"],
                          { $eq: ["$type", "lesson-assessment"] },
                          { $eq: ["$isDeleted", false] },
                        ],`;
  content = content.replace(lessonAssessmentPattern, lessonReplacement);
  console.log('✅ Fixed lesson assessments isDeleted filter');
} else {
  console.log('ℹ️ Lesson assessments already have isDeleted filter or pattern not found');
}

// Write final content
fs.writeFileSync(filePath, content, 'utf8');
console.log('🎉 All assessment filtering fixes completed!');
