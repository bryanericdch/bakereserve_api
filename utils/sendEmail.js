import axios from "axios";

const sendEmail = async ({ email, subject, message }) => {
  try {
    if (!process.env.BREVO_API_KEY || !process.env.EMAIL_USER) {
      console.error(
        "❌ ERROR: BREVO_API_KEY or EMAIL_USER is missing from .env",
      );
      throw new Error("Missing email credentials");
    }

    const payload = {
      sender: {
        name: "BakeReserve",
        email: process.env.EMAIL_USER, // The Gmail you verified on Brevo
      },
      to: [
        {
          email: email, // The user's email signing up
        },
      ],
      subject: subject,
      htmlContent: message,
    };

    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      payload,
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      },
    );

    console.log(
      "✅ Email sent successfully via Brevo! Message ID:",
      response.data.messageId,
    );
  } catch (error) {
    console.error(
      "❌ BREVO EMAIL ERROR:",
      error.response?.data || error.message,
    );
    throw new Error("Email could not be sent");
  }
};

export default sendEmail;
