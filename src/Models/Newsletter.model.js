import mongoose from "mongoose";

const NewsletterSchema = new mongoose.Schema(

    {

        email: { type: String, required: true, unique: true },
        isDeleted: { type: Boolean, default: false }

    }

);
const Newsletter = mongoose.model("School", NewsletterSchema);

export default Newsletter;
