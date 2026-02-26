import nodemailer from "nodemailer";

const sendEmail = async ({ email, subject, message }) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error("❌ ERROR: EMAIL_USER or EMAIL_PASS is missing from .env");
      throw new Error("Missing email credentials");
    }

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587, // 👇 Switched to 587
      secure: false, // 👇 Must be false for 587
      requireTLS: true, // 👇 Forces secure connection
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      family: 4, // Keep IPv4 override
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
