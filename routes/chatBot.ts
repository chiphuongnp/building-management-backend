import { Router } from 'express';
import { sendMessage, clearSession } from '../services/chatBot';
import { validateChat } from '../validations/chat';
import { requireRole } from '../middlewares/permission';
import { UserRole } from '../constants/enum';

const chatRouter = Router();

chatRouter.post('/', validateChat, sendMessage);
chatRouter.delete('/session/:sessionId', requireRole(UserRole.USER), clearSession);

export default chatRouter;
