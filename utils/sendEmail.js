import nodemailer from "nodemailer";

const sendEmail = async ({ email, subject, message }) => {
  try {
    // Check if env variables are actually loaded
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error("❌ ERROR: EMAIL_USER or EMAIL_PASS is missing from .env");
      throw new Error("Missing email credentials");
    }

    // Use direct SMTP settings instead of the "gmail" shortcut
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true, // true for port 465
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"BakeReserve" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: subject,
      html: message,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully! Message ID:", info.messageId);
  } catch (error) {
    console.error("❌ NODEMAILER ERROR:", error);
    throw new Error("Email could not be sent");
  }
};

export default sendEmail;
