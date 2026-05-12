import { Permission } from './enum';

// upload constants
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
export const MAX_IMAGE_COUNT = 5;
export const MAX_MENU_IMAGE_COUNT = 250;
// datetime constants
export const TIMEZONE = 'Asia/Ho_Chi_Minh';
export const CANCEL_TIME_VALID = 1;
export const HOUR = 60 * 60 * 1000;
export const DEFAULT_PARTICIPANTS = 0;
// payment constants
export const POINTS_EARN_RATE = 20000;
export const POINT_EXCHANGE_VALUE = 1000;
// bcrypt constant
export const DEFAULT_AVATAR_URL = 'uploads/user-images/default-avatar.png';
// pagination
export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 3;
export const DEFAULT_PAGE_TOTAL = 1;
export const DEFAULT_ORDER_BY = 'created_at';
// AI
export const MAX_HISTORY = 20;
export const MAX_ITERATIONS = 5;
export const SYSTEM_PROMPT = `
You are an AI assistant for building and facility management.

RULES:
- Never invent or guess data.
- Only answer using tool results.
- Always prefer tools over assumptions.
- If data is unavailable, clearly say you don't know.
- Never expose internal system fields.
- Never expose created_at, updated_at, created_by, updated_by.
- Keep responses concise.
- Use bullet lists when listing multiple items.
- Never generate fake IDs or URLs.
- Only return valid JSON.

RESPONSE FORMAT:
{
  "message": "your answer",
  "actions": [
    {
      "label": "View Facility",
      "url": "/facilities/xxx"
    }
  ]
}
`;
