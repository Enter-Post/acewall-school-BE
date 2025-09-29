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
        user: "support@acewallscholars.org",
        pass: "F@soptipas03",
      },
    });

    const mailOptions = {
      from: `"Support Inquiry" <${"support@acewallscholars.org"}>`,
      to: "support@acewallscholars.org",
      subject: "New Support Request",
      html: `
        <h3>Support Request</h3>
        <p><strong>Name:</strong> ${fullName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Feedback:</strong><br/>${feedback}</p>
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
        user: "support@acewallscholars.org",
        pass: "F@soptipas03",
      },
    });

    const mailOptions = {
      from: `"Contact Form" <${"support@acewallscholars.org"}>`,
      to: "support@acewallscholars.org",
      subject: `Contact Us: ${subject}`,
      html: `
        <h3>Contact Form Submission</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong><br/>${message}</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({ message: "Contact message sent successfully!" });
  } catch (error) {
    console.error("Error sending contact email:", error.message, error.stack);
    return res.status(500).json({ message: "Failed to send contact email." });
  }
};


