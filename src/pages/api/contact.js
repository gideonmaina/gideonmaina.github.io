import nodemailer from "nodemailer";

// Email configuration using Gmail
const EMAIL_CONFIG = {
  SMTP_HOST:
    process.env.NODE_ENV === "development"
      ? import.meta.env.SMTP_HOST
      : process.env.SMTP_HOST,
  SMTP_PORT:
    process.env.NODE_ENV === "development"
      ? import.meta.env.SMTP_PORT
      : process.env.SMTP_PORT,
  SMTP_USER:
    process.env.NODE_ENV === "development"
      ? import.meta.env.SMTP_USER
      : process.env.SMTP_USER,
  SMTP_PASSWORD:
    process.env.NODE_ENV === "development"
      ? import.meta.env.SMTP_PASSWORD
      : process.env.SMTP_PASSWORD,
  RECIPIENT_EMAIL:
    process.env.NODE_ENV === "development"
      ? import.meta.env.RECIPIENT_EMAIL
      : process.env.RECIPIENT_EMAIL,
};

console.log("[DEBUG] Email configuration loaded:", {
  host: EMAIL_CONFIG.SMTP_HOST,
  port: EMAIL_CONFIG.SMTP_PORT,
  user: EMAIL_CONFIG.SMTP_USER,
  recipient: EMAIL_CONFIG.RECIPIENT_EMAIL,
});

// Helper functions for formatting display names
function getSubjectDisplayName(subject) {
  const subjectMap = {
    "web-development": "Web Development Project",
    "iot-consulting": "IoT Consulting",
    "electrical-engineering": "Electrical Engineering",
    collaboration: "Collaboration Opportunity",
    employment: "Employment Opportunity",
    other: "Other",
  };
  return subjectMap[subject] || subject;
}

function getBudgetDisplayName(budget) {
  const budgetMap = {
    "under-5k": "Under $5,000",
    "5k-15k": "$5,000 - $15,000",
    "15k-50k": "$15,000 - $50,000",
    "50k-plus": "$50,000+",
    discuss: "Let's discuss",
  };
  return budgetMap[budget] || budget;
}

// Simple HTML sanitization
function sanitizeHtml(text) {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Generate personalized response based on subject
function getPersonalizedResponse(subject) {
  const responses = {
    "web-development":
      "I'm excited to learn more about your web development project and discuss how we can bring your vision to life with modern technologies.",
    "iot-consulting":
      "IoT projects are fascinating! I'd love to explore how we can create innovative solutions using sensors, connectivity, and data analytics.",
    "electrical-engineering":
      "Engineering challenges are what I live for! Let's discuss how we can solve your electrical engineering requirements.",
    collaboration:
      "Collaboration opportunities are always exciting. I look forward to learning more about how we can work together.",
    employment:
      "Thank you for considering me for this opportunity. I'm eager to learn more about the role and how I can contribute.",
    other: "I'm curious to learn more about your unique project or inquiry.",
  };
  return responses[subject] || responses["other"];
}

// Create transporter
const transporter = nodemailer.createTransport({
  host: EMAIL_CONFIG.SMTP_HOST,
  port: EMAIL_CONFIG.SMTP_PORT,
  secure: EMAIL_CONFIG.SMTP_PORT == 465 ? true : false, // true for 465, false for other ports
  auth: {
    user: EMAIL_CONFIG.SMTP_USER,
    pass: EMAIL_CONFIG.SMTP_PASSWORD,
  },
});

console.log("[DEBUG] Nodemailer transporter created");

export async function POST({ request }) {
  console.log("[DEBUG] POST request received at", new Date().toISOString());

  try {
    // Parse form data
    const formData = await request.formData();
    console.log("[DEBUG] Form data received:", Object.fromEntries(formData));
    const data = Object.fromEntries(formData);
    console.log("[DEBUG] Parsed data:", data);

    // Validate required fields
    const requiredFields = [
      "firstName",
      "lastName",
      "email",
      "subject",
      "message",
    ];
    const missingFields = requiredFields.filter((field) => !data[field]);

    console.log("[DEBUG] Required fields check:", {
      requiredFields,
      missingFields,
    });

    if (missingFields.length > 0) {
      console.log("[DEBUG] Validation failed - missing fields:", missingFields);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Missing required fields: ${missingFields.join(", ")}`,
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }

    // Validate field lengths
    const fieldLimits = {
      firstName: 50,
      lastName: 50,
      email: 100,
      company: 100,
      message: 5000,
    };

    for (const [field, limit] of Object.entries(fieldLimits)) {
      if (data[field] && data[field].length > limit) {
        console.log(
          `[DEBUG] Validation failed - ${field} too long:`,
          data[field].length,
          "chars, limit:",
          limit,
        );
        return new Response(
          JSON.stringify({
            success: false,
            error: `${field} is too long (maximum ${limit} characters)`,
          }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
            },
          },
        );
      }
    }

    // Validate subject is one of the allowed values
    const allowedSubjects = [
      "web-development",
      "iot-consulting",
      "electrical-engineering",
      "collaboration",
      "employment",
      "other",
    ];
    if (!allowedSubjects.includes(data.subject)) {
      console.log("[DEBUG] Validation failed - invalid subject:", data.subject);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid subject selected",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }

    // Validate budget if provided
    if (data.budget) {
      const allowedBudgets = [
        "under-5k",
        "5k-15k",
        "15k-50k",
        "50k-plus",
        "discuss",
      ];
      if (!allowedBudgets.includes(data.budget)) {
        console.log("[DEBUG] Validation failed - invalid budget:", data.budget);
        return new Response(
          JSON.stringify({
            success: false,
            error: "Invalid budget range selected",
          }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
            },
          },
        );
      }
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      console.log(
        "[DEBUG] Validation failed - invalid email format:",
        data.email,
      );
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid email address",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }

    console.log("[DEBUG] All validations passed, preparing email...");

    // Prepare email content
    const emailSubject = `New Contact: ${getSubjectDisplayName(data.subject)} - ${sanitizeHtml(data.firstName)} ${sanitizeHtml(data.lastName)}${data.company ? ` (${sanitizeHtml(data.company)})` : ""}`;

    console.log("[DEBUG] Email subject prepared:", emailSubject);

    const emailBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
    .field { margin-bottom: 15px; }
    .label { font-weight: bold; color: #555; }
    .value { margin-top: 5px; padding: 10px; background: white; border-radius: 4px; border-left: 4px solid #667eea; }
    .footer { margin-top: 20px; padding: 15px; background: #eee; border-radius: 4px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>🚀 New Contact Form Submission</h2>
      <p>You've received a new message from your website!</p>
    </div>

    <div class="content">
      <div class="field">
        <div class="label">👤 Name:</div>
        <div class="value">${sanitizeHtml(data.firstName)} ${sanitizeHtml(data.lastName)}</div>
      </div>

      <div class="field">
        <div class="label">📧 Email:</div>
        <div class="value"><a href="mailto:${sanitizeHtml(data.email)}">${sanitizeHtml(data.email)}</a></div>
      </div>

      ${
        data.company
          ? `
      <div class="field">
        <div class="label">🏢 Company:</div>
        <div class="value">${sanitizeHtml(data.company)}</div>
      </div>
      `
          : ""
      }

      <div class="field">
        <div class="label">📋 Subject:</div>
        <div class="value">${getSubjectDisplayName(data.subject)}</div>
      </div>

      ${
        data.budget
          ? `
      <div class="field">
        <div class="label">💰 Budget:</div>
        <div class="value">${getBudgetDisplayName(data.budget)}</div>
      </div>
      `
          : ""
      }

      <div class="field">
        <div class="label">💬 Message:</div>
        <div class="value">${sanitizeHtml(data.message).replace(/\n/g, "<br>")}</div>
      </div>

      ${
        data.newsletter
          ? `
      <div class="field">
        <div class="label">📬 Newsletter:</div>
        <div class="value">✅ Wants to receive updates about latest projects and blog posts</div>
      </div>
      `
          : ""
      }
    </div>

    <div class="footer">
      <p>This message was sent from the contact form on gideonmaina.me</p>
      <p>Timestamp: ${new Date().toLocaleString()}</p>
    </div>
  </div>
</body>
</html>
    `;

    // Send main email
    const mailOptions = {
      from: `"Contact Form" <${EMAIL_CONFIG.SMTP_USER}>`,
      to: EMAIL_CONFIG.RECIPIENT_EMAIL,
      replyTo: data.email,
      subject: emailSubject,
      html: emailBody,
      text: `
New Contact Form Submission

Name: ${data.firstName} ${data.lastName}
Email: ${data.email}
${data.company ? `Company: ${data.company}\n` : ""}
Subject: ${getSubjectDisplayName(data.subject)}
${data.budget ? `Budget: ${getBudgetDisplayName(data.budget)}\n` : ""}

Message:
${data.message}

${data.newsletter ? "Newsletter: Yes - Wants to receive updates about projects and blog posts\n" : ""}
Timestamp: ${new Date().toLocaleString()}
      `.trim(),
    };

    console.log("[DEBUG] Sending main email to:", EMAIL_CONFIG.RECIPIENT_EMAIL);
    await transporter.sendMail(mailOptions);
    console.log("[DEBUG] Main email sent successfully");

    // Send auto-reply to the user
    const autoReplyOptions = {
      from: `"Gideon Maina" <${EMAIL_CONFIG.SMTP_USER}>`,
      to: data.email,
      subject: "Thank you for your message!",
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .footer { margin-top: 20px; padding: 15px; background: #eee; border-radius: 4px; font-size: 12px; color: #666; text-align: center; }
    .cta { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 25px; border-radius: 6px; text-decoration: none; display: inline-block; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>🙏 Thank You, ${data.firstName}!</h2>
      <p>Your message has been received</p>
    </div>

    <div class="content">
      <p>Hi ${data.firstName},</p>

      <p>Thank you for reaching out! I've received your message about "<strong>${getSubjectDisplayName(data.subject)}</strong>" and I'm excited to learn more about your project.</p>

      <p>${getPersonalizedResponse(data.subject)}</p>

      ${data.budget ? `<p>I appreciate you sharing your budget range of <strong>${getBudgetDisplayName(data.budget)}</strong>. This helps me understand the scope and provide you with the most relevant solutions.</p>` : ""}

      ${data.company ? `<p>I look forward to potentially working with <strong>${data.company}</strong> and contributing to your team's success.</p>` : ""}

      <p>Here's what happens next:</p>
      <ul>
        <li>🕐 I'll review your message within the next few hours</li>
        <li>📞 I'll get back to you within 24 hours with a detailed response</li>
        <li>🤝 We'll schedule a call if your project seems like a good fit</li>
      </ul>

      <p>In the meantime, feel free to check out my latest work on <a href="https://github.com/gideon-maina">GitHub</a> or connect with me on <a href="https://linkedin.com/in/gideon-maina">LinkedIn</a>.</p>

      <a href="https://gideonmaina.me/projects" class="cta">View My Recent Projects</a>

      <p>Looking forward to our conversation!</p>

      <p>Best regards,<br>
      <strong>Gideon Maina</strong><br>
      Electrical Engineer & IoT Developer</p>
    </div>

    <div class="footer">
      <p> 🌐 gideonmaina.me</p>
      <p>This is an automated response. Please don't reply to this email.</p>
    </div>
  </div>
</body>
</html>
      `,
      text: `
Hi ${data.firstName},

Thank you for reaching out! I've received your message about "${getSubjectDisplayName(data.subject)}" and I'm excited to learn more about your project.

${getPersonalizedResponse(data.subject).replace(/<[^>]*>/g, "")}

${data.budget ? `I appreciate you sharing your budget range of ${getBudgetDisplayName(data.budget)}. This helps me understand the scope and provide you with the most relevant solutions.\n\n` : ""}${data.company ? `I look forward to potentially working with ${data.company} and contributing to your team's success.\n\n` : ""}Here's what happens next:
- I'll review your message within the next few hours
- I'll get back to you within 24 hours with a detailed response
- We'll schedule a call if your project seems like a good fit

In the meantime, feel free to check out my latest work on GitHub or connect with me on LinkedIn.

Looking forward to our conversation!

Best regards,
Gideon Maina
Electrical Engineer & IoT Developer

gideonmaina.me
      `.trim(),
    };

    console.log("[DEBUG] Sending auto-reply to:", data.email);
    await transporter.sendMail(autoReplyOptions);
    console.log("[DEBUG] Auto-reply sent successfully");

    console.log("[DEBUG] Contact form submission completed successfully");
    return new Response(
      JSON.stringify({
        success: true,
        message: "Email sent successfully!",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    console.error("[ERROR] Contact form error:", error);
    console.error("[ERROR] Error stack:", error.stack);

    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to send email. Please try again later.",
        debug:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
}

// Handle preflight requests for CORS
export async function OPTIONS() {
  console.log("[DEBUG] OPTIONS request received for CORS preflight");
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
