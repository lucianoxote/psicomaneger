import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY não configurada no .env.local');
}

export const resend = new Resend(process.env.RESEND_API_KEY);
export const resendLivia = new Resend(process.env.RESEND_API_KEY_LIVIA || process.env.RESEND_API_KEY);
