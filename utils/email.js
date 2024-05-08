const nodemailer = require("nodemailer");
const htmlToText = require("html-to-text");

const AppError = require("../utils/appError");

module.exports = class Email {
  constructor({ user, url, resetToken }) {
    this.to = user.email;
    this.firstName = user.name.split(" ")[0];
    this.url = url;
    this.resetToken = resetToken;
    this.from = `TikTok <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async send(template, subject) {
    // 1) Render HTML based on the template
    let html;
    if (template === "welcome") {
      html = `<!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome New User</title>
        </head>
        <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; color: #333; text-align: center; padding: 20px;">
        
          <h1>Welcome to TikTok !</h1>
        
          <p>Dear ${this.firstName},</p>
        
          <p>We are excited to welcome you to our community! Thank you for joining us. Your presence means a lot to us.</p>
        
          <p>Feel free to explore our platform and discover the amazing things it has to offer. If you have any questions or need assistance, don't hesitate to reach out to our support team.</p>
        
          <p>Click here to go to watch interesting videos now: <a href=${this.url}>Watch videos</a></p> 

          <p>Once again, welcome aboard!</p>
        
          <p>Best regards,<br>
            The TikTok team</p>
        
        </body>
        </html>`;
    } else if (template === "passwordReset") {
      html = `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome New User</title>
      </head>
      <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; color: #333; text-align: center; padding: 20px;">
        <h2>Dear ${this.firstName},</h2>
      
        <p>Here is your password reset token: ${this.resetToken}</p>
      
      
        <p>If you have any questions or need assistance, don't hesitate to reach out to our support team.</p>
      
        <p>Best regards,<br>
          The TikTok team</p>
      </body>
      </html>`;
    }

    // 2) Define email option
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText.convert(html),
    };

    // 3) Create a transport and send email
    this.newTransport().sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log("Error: ", error);
        console.log("An error occurred while sending email");
      } else {
        console.log("Email sent successfully");
      }
    });
  }

  async sendWelcome() {
    await this.send("welcome", "Welcome to the TikTok family!");
  }

  async sendPasswordReset() {
    await this.send(
      "passwordReset",
      "Your password reset token (valid for only 10 minutes)"
    );
  }
};
