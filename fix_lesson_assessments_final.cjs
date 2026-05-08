const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing lesson assessments isDeleted filter...');

// Read the chapter controller file
const filePath = path.join(__dirname, 'src/Contollers/CourseControllers/chapter.controller.js');
let content = fs.readFileSync(filePath, 'utf8');

// Split into lines for precise manipulation
const lines = content.split('\n');
let modified = false;

// Find and fix the lesson assessments filter
for (let i = 0; i < lines.length; i++) {
  // Look for the lesson assessment type line
  if (lines[i].trim().includes('{ $eq: ["$type", "lesson-assessment"] },')) {
    // Check if the next line is the closing bracket
    if (i + 1 < lines.length && lines[i + 1].trim().includes('],')) {
      // Insert isDeleted filter before the closing bracket
      lines.splice(i + 1, 0, '                          { $eq: ["$isDeleted", false] },');
      modified = true;
      console.log('✅ Inserted isDeleted filter for lesson assessments');
      break;
    }
  }
}

if (!modified) {
  console.log('❌ Could not find the exact location to insert lesson assessment filter');
} else {
  // Reassemble the content
  content = lines.join('\n');
  
  // Write back the modified content
  fs.writeFileSync(filePath, content, 'utf8');
  
  // Verify the fix
  const verifyContent = fs.readFileSync(filePath, 'utf8');
  if (verifyContent.includes('{ $eq: ["$isDeleted", false] }') && 
      verifyContent.includes('lesson-assessment')) {
    console.log('✅ Verification passed: isDeleted filter found in lesson assessments');
  } else {
    console.log('❌ Verification failed: isDeleted filter not found in lesson assessments');
  }
}

console.log('🎉 Lesson assessments filtering fix completed!');
