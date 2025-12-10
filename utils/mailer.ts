import * as ENV from '../configs/envConfig';
import transporter from '../configs/nodemailer';
import { ErrorMessage } from '../constants/message';

export const sendEmail = async (to: string, subject: string, html: string): Promise<void> => {
  if (!to) throw new Error(ErrorMessage.RECIPIENT_MAIL_REQUIRED);

  if (!ENV.EMAIL_USER) throw new Error(ErrorMessage.SENDER_MAIL_NOT_CONFIGURED);

  await transporter.sendMail({
    from: ENV.EMAIL_USER,
    to,
    subject,
    html,
  });
};
