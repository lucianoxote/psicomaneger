import { Resend } from 'resend';

const apiKey = process.env.RESEND_API_KEY || 're_dummy_key_for_build';

if (!process.env.RESEND_API_KEY && process.env.NODE_ENV === 'production') {
  console.warn('⚠️ RESEND_API_KEY não configurada na Vercel. E-mails não serão enviados.');
}

export const resend = new Resend(apiKey);
export const resendLivia = new Resend(process.env.RESEND_API_KEY_LIVIA || apiKey);
