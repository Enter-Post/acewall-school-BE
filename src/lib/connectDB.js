import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: "District-QA",
    });
    console.log("DB connected succcesfully");
  } catch (error) {
    console.log("error in DB connection", error);
  }
};