import nodemailer from 'nodemailer';
import * as ENV from './envConfig';

const transporter = nodemailer.createTransport({
  host: ENV.SMTP_HOST || 'smtp.gmail.com',
  port: Number(ENV.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: ENV.EMAIL_USER,
    pass: ENV.EMAIL_PASSWORD,
  },
});

export default transporter;
