import nodemailer from "nodemailer";

export const sendSchoolcontactmail = async (req, res) => {
    try {
        const {
            organization,
            contactPerson,
            contactNumber,
            contactEmail,
            teachers,
            students,
            schoolSize,
            address,
        } = req.body;

        // Transporter setup (replace with your SMTP)
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: process.env.MAIL_PORT,
            secure: true,
            auth: {
                user: "support@acewallscholars.org",
                pass: "ecgdupvzkfmbqrrq",
            },
        });

        // test connection
        transporter.verify((error, success) => {
            if (error) {
                console.error("SMTP Error:", error);
            } else {
                console.log("SMTP Connected:", success);
            }
        });

        // Mail options
        const mailOptions = {
            from: `"Acewall Scholars Contact" <support@acewallscholars.org>`, // sender address
            to: ["support@acewallscholars.org", "programs@acewallscholars.org"],
            subject: `New Contact Submission from ${organization}`,
            html: `
  <div style="font-family: Arial, sans-serif; background-color: #f4f7fb; padding: 20px;">
    <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
      
      <!-- Logo -->
      <div style="text-align: center; padding: 20px; background: #ffffff;">
        <img src="https://lirp.cdn-website.com/6602115c/dms3rep/multi/opt/acewall+scholars-431w.png" 
             alt="Acewall Scholars Logo" 
             style="height: 60px; margin: 0 auto;" />
      </div>

      <!-- Header -->
      <div style="background: #28a745; padding: 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 20px;">New School Contact Submission</h1>
      </div>

      <!-- Body -->
      <div style="padding: 20px; color: #333; font-size: 15px;">
        <p><strong>Organization:</strong> ${organization}</p>
        <p><strong>Contact Person:</strong> ${contactPerson}</p>
        <p><strong>Contact Number:</strong> ${contactNumber}</p>
        <p><strong>Contact Email:</strong> ${contactEmail}</p>
        <p><strong>No. of Teachers:</strong> ${teachers}</p>
        <p><strong>No. of Students:</strong> ${students}</p>
        <p><strong>School Size:</strong> ${schoolSize}</p>
        <p><strong>Address:</strong> ${address}</p>
      </div>

      <!-- Footer -->
      <div style="background: #f0f4f8; color: #555; text-align: center; padding: 15px; font-size: 12px;">
        <p style="margin: 0;">Acewall Scholars © ${new Date().getFullYear()}</p>
        <p style="margin: 0;">This message was generated from the school contact form.</p>
      </div>
    </div>
  </div>
  `,
        };


        // Send email
        await transporter.sendMail(mailOptions);

        res.json({ success: true, message: "Email sent successfully!" });
    } catch (error) {
        console.log("error in sending contact mail", error);
        res.status(500).json({ message: "Internal Server Error" })
    }
}