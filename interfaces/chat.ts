import { ChatRole } from '../constants/enum';

export interface MessageInterface {
  role: ChatRole;
  content: string;
}

export interface Action {
  label: string;
  url: string;
}

export interface ChatResponse {
  message: string;
  actions: Action[];
}
