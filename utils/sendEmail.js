import nodemailer from "nodemailer";

const sendEmail = async ({ email, subject, message }) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error("❌ ERROR: EMAIL_USER or EMAIL_PASS is missing from .env");
      throw new Error("Missing email credentials");
    }

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      // 👇 THIS IS THE MAGIC FIX FOR RENDER 👇
      family: 4,
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
