import transporter from '../configs/nodemailer';
import { ErrorMessage } from '../constants/message';

export const sendEmail = async (to: string, subject: string, html: string): Promise<void> => {
  if (!to) throw new Error(ErrorMessage.RECIPIENT_MAIL_REQUIRED);

  if (!process.env.EMAIL_USER) throw new Error(ErrorMessage.SENDER_MAIL_NOT_CONFIGURED);

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    html,
  });
};
