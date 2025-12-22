// netlify/functions/send-email.js

const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

exports.handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const { to, subject, html } = JSON.parse(event.body);

    const response = await resend.emails.send({
      from: "noreply@thewritersblock.com",
      to: to,
      subject: subject,
      html: html,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        messageId: response.id,
      }),
    };
  } catch (error) {
    console.error("Email error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message,
      }),
    };
  }
};