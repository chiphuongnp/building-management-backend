import Groq from 'groq-sdk';
import * as ENV from './envConfig';

export const groqClient = new Groq({
  apiKey: ENV.GROQ_API_KEY,
});
