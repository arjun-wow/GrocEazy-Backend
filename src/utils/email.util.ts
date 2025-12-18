import axios from 'axios';
import logger from '../config/logger.js'; // Confirmed location

interface EmailSender {
    name: string;
    email: string;
}

interface EmailRecipient {
    name?: string;
    email: string;
}

/**
 * Send an email using Brevo API via Axios
 */
export const sendEmail = async (
    to: string | EmailRecipient[],
    subject: string,
    text: string,
    htmlContent?: string
) => {
    try {
        const apiKey = process.env.BREVO_API_KEY;
        if (!apiKey) {
            logger.warn('BREVO_API_KEY missing in environment. Email not sent.');
            return;
        }

        const senderEmail = process.env.SENDER_EMAIL || "noreply@groceazy.com";
        const senderName = "GrocEazy Team";

        const recipients = Array.isArray(to)
            ? to
            : [{ email: to }];

        const payload = {
            sender: { name: senderName, email: senderEmail },
            to: recipients,
            subject,
            textContent: text,
            htmlContent: htmlContent || undefined,
        };

        const response = await axios.post(
            'https://api.brevo.com/v3/smtp/email',
            payload,
            {
                headers: {
                    'api-key': apiKey,
                    'Content-Type': 'application/json',
                },
            }
        );

        logger.info(`Email sent to ${JSON.stringify(recipients)}: ${response.data?.messageId || 'Success'}`);
    } catch (error: any) {
        logger.error('Email failed:', error.response?.data || error.message);
        // We don't throw here to ensure main flow continues
    }
};

// --- Templates ---

export const getWelcomeEmail = (userName: string) => ({
    subject: "Welcome to GrocEazy!",
    text: `
Hello ${userName},

Welcome to GrocEazy! We are thrilled to have you on board.
Explore our fresh groceries and enjoy seamless shopping.

Happy Shopping,
The GrocEazy Team
`
});

export const getOrderConfirmedEmail = (userName: string, orderId: string, total: number) => ({
    subject: `Order Confirmed: #${orderId}`,
    text: `
Hello ${userName},

Your order #${orderId} has been confirmed!
Total Amount: ₹${total}

We will notify you when it ships.

Regards,
GrocEazy
`
});

export const getOrderStatusUpdateEmail = (userName: string, orderId: string, status: string) => ({
    subject: `Order Update: #${orderId} is ${status}`,
    text: `
Hello ${userName},

Your order #${orderId} is now ${status}.

${status === 'Out for Delivery' ? 'Get ready!' : 'Track your order in the app.'}

Regards,
GrocEazy
`
});

export const getOrderCancelledEmail = (userName: string, orderId: string) => ({
    subject: `Order Cancelled: #${orderId}`,
    text: `
Hello ${userName},

Your order #${orderId} has been cancelled.
If you have any questions, please contact support.

Regards,
GrocEazy
`
});

export const getAccountStatusEmail = (userName: string, isActive: boolean) => ({
    subject: `Account Status Update`,
    text: `
Hello ${userName},

Your GrocEazy account has been ${isActive ? 'activated' : 'deactivated'} by an administrator.
${!isActive ? 'Please contact support if you believe this is an error.' : 'You can now log in and shop.'}

Regards,
GrocEazy
`
});

// Support Ticket Templates

export const getTicketCreatedEmail = (userName: string, ticketNumber: string, subject: string) => ({
    subject: `Support Ticket Received: ${ticketNumber}`,
    text: `
Hello ${userName},

Thank you for raising a ticket regarding "${subject}".
We are looking into it and we will shortly resolve it.

Ticket ID: ${ticketNumber}

Regards,
GrocEazy Support
`
});

export const getTicketStatusUpdateEmail = (userName: string, ticketNumber: string, status: string) => ({
    subject: `Ticket Status Updated: ${ticketNumber}`,
    text: `
Hello ${userName},

The status of your ticket #${ticketNumber} has been updated to "${status}".

Regards,
GrocEazy Support
`
});

export const getTicketResolvedEmail = (userName: string, ticketNumber: string) => ({
    subject: `Ticket Resolved: ${ticketNumber}`,
    text: `
Hello ${userName},

Your issue related to ticket #${ticketNumber} is resolved.
Please check for files present here (if any).

Regards,
GrocEazy Support
`
});

export const getTicketAssignedEmail = (managerName: string, ticketNumber: string) => ({
    subject: `New Ticket Assigned: ${ticketNumber}`,
    text: `
Hello ${managerName},

You have been assigned a ticket #${ticketNumber} to resolve.
Please check your dashboard.

Regards,
GrocEazy Admin
`
});

// --- Auth & Operations Templates ---

export const getResetPasswordEmail = (userName: string, resetLink: string) => ({
    subject: "Reset Your Password",
    text: `
Hello ${userName},

We received a request to reset your password.
Click the link below to reset it:

${resetLink}

If you did not request this, please ignore this email.

Regards,
GrocEazy Team
`
});

export const getLowStockEmail = (productName: string, currentStock: number, productId: string) => ({
    subject: `Low Stock Alert: ${productName}`,
    text: `
Alert: Low Stock for Product

Product: ${productName}
ID: ${productId}
Current Stock: ${currentStock}

Please restock immediately.

Regards,
GrocEazy System
`
});
