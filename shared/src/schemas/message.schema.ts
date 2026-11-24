import { ChatMessage, EmojiReaction } from '../types/message.types';

export interface SendChatMessageInput {
  roomId: string;
  text: string;
}

export interface SendReactionInput {
  roomId: string;
  emoji: string;
}
