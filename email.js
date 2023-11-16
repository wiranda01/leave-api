const nodemailer = require("nodemailer");
const moment = require("moment-timezone");

// Set the timezone for your application
moment.tz.setDefault("Asia/Bangkok");

const capitalize = (string) => string.charAt(0).toUpperCase() + string.slice(1);

const emailContent = (
  method,
  receiver,
  sender,
  startDate,
  endDate,
  reason,
  backupContact,
  docId,
  firstStatus,
  secondStatus
) => {
  const myDate = moment();

  if (method === "request") {
    return `
    <div style="color: black;">
    <h1>Hi ${receiver}</h1>
    <p>You have a new pending leave document to review. Please Review it at Syaco Leave Management.</p>
    <p>Sender: ${sender}</p>
    <p>Date: ${startDate.toLocaleDateString(
      "en-GB"
    )} - ${endDate.toLocaleDateString("en-GB")}</p>
    <p>Sent At: ${myDate.format("DD/MM/YYYY HH:mm:ss")}</p>
    <p>Reason: ${reason}</p>
    <p>Backup Contact: ${backupContact}</p>
    </div>`;
  } else {
    return `
    <div style="color: black;">
    <h1>Hi ${receiver}</h1>
    <p>${sender} has ${method} leave approval ${docId}. You can view or review it if you are an approver at Syaco Leave Management.</p>
    <p>Reviewed At: ${sentAt.toLocaleString("en-GB")}</p>
    <p>First Approver Status: ${capitalize(firstStatus)}</p>
    <p>Second Approver Status: ${capitalize(secondStatus)}</p>
    </div>`;
  }
};

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: "syaco.leave.management@gmail.com",
    pass: "gnkc hvsm qjkz ikou",
  },
});

const sendEmail = (to, subject, html) => {
  const mailOptions = {
    from: "Syaco Leave Management<syaco.leave.management@gmail.com>",
    to,
    subject,
    html,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log("Error: " + error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
};

module.exports = { sendEmail, emailContent };
