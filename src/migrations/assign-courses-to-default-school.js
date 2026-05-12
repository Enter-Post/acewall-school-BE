/**
 * Migration: Assign existing courses to default school and district
 * Run this before making schoolId/districtId required in Course model
 *
 * Usage: node src/migrations/assign-courses-to-default-school.js
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import CourseSch from "../Models/courses.model.sch.js";
import School from "../Models/school.model.js";
import District from "../Models/district.model.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/acewall";

async function migrate() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI, { dbName: "dev" });
    console.log("Connected successfully\n");

    // 1. Check if there's a default district, create if not
    let defaultDistrict = await District.findOne({ code: "DEFAULT" });

    if (!defaultDistrict) {
      console.log("Creating default district...");
      defaultDistrict = new District({
        name: "Default District",
        code: "DEFAULT",
        contactEmail: "admin@default.edu",
        active: true,
      });
      await defaultDistrict.save();
      console.log(`✓ Created default district: ${defaultDistrict._id}`);
    } else {
      console.log(`✓ Found default district: ${defaultDistrict._id}`);
    }

    // 2. Check if there's a default school, create if not
    let defaultSchool = await School.findOne({
      districtId: defaultDistrict._id,
      name: "Default School",
    });

    if (!defaultSchool) {
      console.log("\nCreating default school...");
      defaultSchool = new School({
        name: "Default School",
        districtId: defaultDistrict._id,
        email: "school@default.edu",
        phone: "000-000-0000",
        active: true,
      });
      await defaultSchool.save();
      console.log(`✓ Created default school: ${defaultSchool._id}`);
    } else {
      console.log(`✓ Found default school: ${defaultSchool._id}`);
    }

    // 3. Find all courses without schoolId or districtId
    const coursesToUpdate = await CourseSch.find({
      $or: [
        { schoolId: { $exists: false } },
        { districtId: { $exists: false } },
        { schoolId: null },
        { districtId: null },
      ],
    });

    console.log(`\nFound ${coursesToUpdate.length} courses without school/district assignment`);

    if (coursesToUpdate.length === 0) {
      console.log("✓ All courses already have school and district assigned");
      await mongoose.disconnect();
      return;
    }

    // 4. Update courses with default school and district
    const bulkOps = coursesToUpdate.map((course) => ({
      updateOne: {
        filter: { _id: course._id },
        update: {
          $set: {
            schoolId: defaultSchool._id,
            districtId: defaultDistrict._id,
          },
        },
      },
    }));

    const result = await CourseSch.bulkWrite(bulkOps);

    console.log(`\n✓ Migration complete:`);
    console.log(`  - Modified: ${result.modifiedCount} courses`);
    console.log(`  - Matched: ${result.matchedCount} courses`);

    // 5. Verify all courses now have school and district
    const remaining = await CourseSch.countDocuments({
      $or: [
        { schoolId: { $exists: false } },
        { districtId: { $exists: false } },
        { schoolId: null },
        { districtId: null },
      ],
    });

    if (remaining === 0) {
      console.log("\n✅ All courses now have schoolId and districtId assigned");
    } else {
      console.log(`\n⚠️ Warning: ${remaining} courses still missing assignments`);
    }

    // Summary
    const totalCourses = await CourseSch.countDocuments();
    const schoolCourses = await CourseSch.countDocuments({ schoolId: defaultSchool._id });

    console.log(`\n📊 Summary:`);
    console.log(`  - Total courses: ${totalCourses}`);
    console.log(`  - In default school: ${schoolCourses}`);
    console.log(`  - Default district: ${defaultDistrict.name} (${defaultDistrict._id})`);
    console.log(`  - Default school: ${defaultSchool.name} (${defaultSchool._id})`);

    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Migration failed:", error.message);
    console.error(error.stack);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrate();
}

export default migrate;
