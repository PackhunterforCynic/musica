import { UserRole } from './participant.types';

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  text: string;
  timestamp: string;
}

export interface EmojiReaction {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  emoji: string;
  timestamp: string;
}
