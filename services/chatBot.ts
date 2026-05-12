import { Response } from 'express';
import Groq from 'groq-sdk';
import { AuthRequest } from '../interfaces/jwt';
import { ChatResponse } from '../interfaces/chat';
import { ErrorMessage, Message, StatusCode } from '../constants/message';
import { ChatRole } from '../constants/enum';
import { responseSuccess, responseError } from '../utils';
import { logger } from '../utils/logger';
import { MAX_HISTORY, MAX_ITERATIONS, SYSTEM_PROMPT } from '../constants/constant';
import { getBuildings, getBuildingById } from './building';
import { getFacilities, getFacilityById, getAvailableFacility } from './facility';
import { mockRes } from '../utils/mockRes';
import { groqClient } from '../configs/groq';
import { TOOLS } from './chatTool';
import { Building } from '../interfaces/building';
import { Facility } from '../interfaces/facility';

const sessions = new Map<string, Groq.Chat.Completions.ChatCompletionMessageParam[]>();
const trimHistory = (history: Groq.Chat.Completions.ChatCompletionMessageParam[]) => {
  const systemMessage = history[0];
  const recentMessages = history.slice(-MAX_HISTORY);

  return [systemMessage, ...recentMessages];
};

async function executeTool(name: string, args: Record<string, any>): Promise<string> {
  try {
    switch (name) {
      case 'get_buildings': {
        const req = {
          query: {
            name: args.name,
            status: args.status,
          },
          pagination: {
            page: 1,
            page_size: 3,
          },
        } as any;

        const res = mockRes();
        await getBuildings(req, res);

        const result = res.getData();
        return JSON.stringify({
          total: result.data.pagination.total,
          buildings: result.data.buildings as Building[],
        });
      }

      case 'get_building_by_id': {
        const req = {
          params: { id: args.id },
        } as any;

        const res = mockRes();
        await getBuildingById(req, res);

        const result = res.getData();
        if (res.getStatus() >= 400) {
          return JSON.stringify({ error: 'Building not found' });
        }

        return JSON.stringify(result.data as Building);
      }

      case 'get_facilities': {
        const req = {
          query: {
            name: args.name,
            status: args.status,
            building_id: args.building_id,
          },
          pagination: {
            page: 1,
            page_size: 3,
          },
        } as any;

        const res = mockRes();
        await getFacilities(req, res);

        const result = res.getData();
        return JSON.stringify({
          total: result.data.pagination.total,
          facilities: result.data.facilities as Facility,
        });
      }

      case 'get_facility_by_id': {
        const req = {
          params: { id: args.id },
        } as any;
        const res = mockRes();
        await getFacilityById(req, res);

        const result = res.getData();
        if (res.getStatus() >= 400) {
          return JSON.stringify({ error: 'Facility not found' });
        }

        return JSON.stringify(result.data as Facility);
      }

      case 'get_available_facilities': {
        const req = {} as any;
        const res = mockRes();
        await getAvailableFacility(req, res);

        const result = res.getData();
        return JSON.stringify({
          total: result.data.length,
          facilities: result.data as Facility,
        });
      }

      default:
        return JSON.stringify({
          error: `Unknown tool: ${name}`,
        });
    }
  } catch (error) {
    logger.error(`Tool execution failed: ${name}`, error);

    return JSON.stringify({
      error: 'Tool execution failed',
    });
  }
}

async function runAgentLoop(
  history: Groq.Chat.Completions.ChatCompletionMessageParam[],
): Promise<string> {
  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const response = await groqClient.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.1,
      max_tokens: 1024,
      tool_choice: 'auto',
      tools: TOOLS,
      messages: history,
    });

    const assistantMessage = response.choices[0].message;

    history.push(assistantMessage as any);

    if (!assistantMessage.tool_calls || assistantMessage.tool_calls.length === 0) {
      return assistantMessage.content ?? '';
    }

    for (const toolCall of assistantMessage.tool_calls) {
      const toolName = toolCall.function.name;
      const args = JSON.parse(toolCall.function.arguments || '{}');

      logger.info(`[TOOL CALL] ${toolName} ${JSON.stringify(args)}`);

      const result = await executeTool(toolName, args);
      history.push({
        role: ChatRole.TOOL,
        tool_call_id: toolCall.id,
        content: result,
      } as any);
    }
  }

  return JSON.stringify({
    message: 'Sorry, I could not complete the request.',
    actions: [],
  });
}

const parseResponse = (raw: string): ChatResponse => {
  try {
    const cleaned = raw
      .replace(/^```json/gm, '')
      .replace(/^```/gm, '')
      .replace(/```$/gm, '')
      .trim();

    return JSON.parse(cleaned);
  } catch {
    return {
      message: raw,
      actions: [],
    };
  }
};

export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId, message } = req.body;
    const history = sessions.get(sessionId) ?? [
      {
        role: ChatRole.SYSTEM as any,
        content: SYSTEM_PROMPT,
      },
    ];

    history.push({
      role: ChatRole.USER,
      content: message,
    });

    const trimmedHistory = trimHistory(history);
    const assistantContent = await runAgentLoop(trimmedHistory);
    trimmedHistory.push({
      role: ChatRole.ASSISTANT,
      content: assistantContent,
    });

    sessions.set(sessionId, trimmedHistory);

    const result = parseResponse(assistantContent);

    return responseSuccess(res, Message.CHAT_SUCCESS, result);
  } catch (error) {
    logger.error(ErrorMessage.CANNOT_PROCESS_CHAT, error);

    return responseError(res, StatusCode.CHAT_ERROR, ErrorMessage.CANNOT_PROCESS_CHAT);
  }
};

export const clearSession = async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;

    if (!sessions.has(sessionId)) {
      return responseError(
        res,
        StatusCode.CHAT_SESSION_NOT_FOUND,
        ErrorMessage.CHAT_SESSION_NOT_FOUND,
      );
    }

    sessions.delete(sessionId);

    return responseSuccess(res, Message.SESSION_CLEARED, null);
  } catch (error) {
    logger.error(ErrorMessage.CANNOT_CLEAR_SESSION, error);

    return responseError(res, StatusCode.CHAT_ERROR, ErrorMessage.CANNOT_CLEAR_SESSION);
  }
};
