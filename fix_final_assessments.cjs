const fs = require('fs');
const path = require('path');

// Read the chapter controller file
const filePath = path.join(__dirname, 'src/Contollers/CourseControllers/chapter.controller.js');
let content = fs.readFileSync(filePath, 'utf8');

console.log('Final fix for chapter assessments isDeleted filter...');

// Split into lines for precise manipulation
const lines = content.split('\n');
let modified = false;

// Find and fix the chapter assessments filter
for (let i = 0; i < lines.length; i++) {
  // Look for the chapter assessment type line
  if (lines[i].trim().includes('{ $eq: ["$type", "chapter-assessment"] },')) {
    // Check if the next line is the closing bracket
    if (i + 1 < lines.length && lines[i + 1].trim().includes('],')) {
      // Insert isDeleted filter before the closing bracket
      lines.splice(i + 1, 0, '                    { $eq: ["$isDeleted", false] },');
      modified = true;
      console.log('✅ Inserted isDeleted filter for chapter assessments');
      break;
    }
  }
}

if (!modified) {
  console.log('❌ Could not find the exact location to insert chapter assessment filter');
  console.log('Trying alternative approach...');
  
  // Alternative: find the pattern and replace directly
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('$eq: ["$type", "chapter-assessment"]')) {
      // Replace this line and the next line
      if (i + 1 < lines.length && lines[i + 1].trim() === '],') {
        lines[i] = lines[i].replace('},', '},');
        lines.splice(i + 1, 0, '                    { $eq: ["$isDeleted", false] },');
        modified = true;
        console.log('✅ Alternative insertion successful for chapter assessments');
        break;
      }
    }
  }
}

// Reassemble the content
content = lines.join('\n');

// Write back the modified content
fs.writeFileSync(filePath, content, 'utf8');

if (modified) {
  console.log('🎉 Chapter assessments isDeleted filter has been added successfully!');
} else {
  console.log('❌ Failed to add chapter assessments isDeleted filter');
}

// Verify the fix by checking the content
const verifyContent = fs.readFileSync(filePath, 'utf8');
if (verifyContent.includes('{ $eq: ["$isDeleted", false] }') && 
    verifyContent.includes('chapter-assessment')) {
  console.log('✅ Verification passed: isDeleted filter found in chapter assessments');
} else {
  console.log('❌ Verification failed: isDeleted filter not found in chapter assessments');
}
