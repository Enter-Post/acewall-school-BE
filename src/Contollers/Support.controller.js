import nodemailer from "nodemailer";

export const sendSupportMail = async (req, res) => {
  const { fullName, email, feedback } = req.body;

  console.log("Support request received:", email);

  if (!fullName || !email || !feedback) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true, // true for 465, false for 587
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

   const mailOptions = {
  from: `"Support Inquiry" <support@acewallscholars.org>`,
  to: "support@acewallscholars.org",
  subject: "New Support Request",
  html: `
    <div style="font-family: Arial, sans-serif; background-color: #f4f7fb; padding: 20px;">
      <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background: #10b981; padding: 20px; text-align: center;">
          <h2 style="color: #ffffff; margin: 0; font-size: 22px;">New Support Request</h2>
        </div>

        <!-- Body -->
        <div style="padding: 20px; color: #333;">
          <p style="font-size: 15px; margin: 5px 0;"><strong>Name:</strong> ${fullName}</p>
          <p style="font-size: 15px; margin: 5px 0;"><strong>Email:</strong> ${email}</p>
          <p style="font-size: 15px; margin: 5px 0;"><strong>Feedback:</strong></p>
          <div style="margin-top: 10px; padding: 12px; background: #f9f9f9; border-left: 4px solid #10b981;">
            <p style="margin: 0; font-size: 15px;">${feedback}</p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #f3f4f6; color: #555; text-align: center; padding: 12px; font-size: 12px;">
          <p style="margin: 0;">Acewall Scholars © ${new Date().getFullYear()}</p>
          <p style="margin: 0;">This is an automated message. Please do not reply.</p>
        </div>
      </div>
    </div>
  `,
};


    await transporter.sendMail(mailOptions);

    return res
      .status(200)
      .json({ message: "Support message sent successfully!" });
  } catch (error) {
    console.error("Error sending email:", error);
    return res.status(500).json({ message: "Failed to send support email." });
  }
};


export const sendContactMail = async (req, res) => {
  const { name, email, phone, subject, message } = req.body;

  console.log("Contact request received:", email);

  if (!name || !email || !phone || !subject || !message) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

   const mailOptions = {
  from: `"Contact Form" <support@acewallscholars.org>`,
  to: "support@acewallscholars.org",
  subject: `Contact Us: ${subject}`,
  html: `
    <div style="font-family: Arial, sans-serif; background-color: #f4f7fb; padding: 20px;">
      <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background: #10b981; padding: 20px; text-align: center;">
          <h2 style="color: #ffffff; margin: 0; font-size: 22px;">Contact Form Submission</h2>
        </div>

        <!-- Body -->
        <div style="padding: 20px; color: #333;">
          <p style="font-size: 15px; margin: 8px 0;"><strong>Name:</strong> ${name}</p>
          <p style="font-size: 15px; margin: 8px 0;"><strong>Email:</strong> ${email}</p>
          <p style="font-size: 15px; margin: 8px 0;"><strong>Phone:</strong> ${phone}</p>
          <p style="font-size: 15px; margin: 8px 0;"><strong>Subject:</strong> ${subject}</p>
          <p style="font-size: 15px; margin: 8px 0;"><strong>Message:</strong></p>
          <div style="margin-top: 10px; padding: 12px; background: #f9f9f9; border-left: 4px solid #10b981;">
            <p style="margin: 0; font-size: 15px; white-space: pre-line;">${message}</p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #f3f4f6; color: #555; text-align: center; padding: 12px; font-size: 12px;">
          <p style="margin: 0;">Acewall Scholars © ${new Date().getFullYear()}</p>
          <p style="margin: 0;">This is an automated message. Please do not reply.</p>
        </div>
      </div>
    </div>
  `,
};


    await transporter.sendMail(mailOptions);

    return res.status(200).json({ message: "Contact message sent successfully!" });
  } catch (error) {
    console.error("Error sending contact email:", error.message, error.stack);
    return res.status(500).json({ message: "Failed to send contact email." });
  }
};


