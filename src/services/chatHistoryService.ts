type Chat = any;
type Message = any;
import { chatService } from './chatService';

const N8N_API_URL = process.env.NEXT_PUBLIC_N8N_API_URL || 'https://n8n.isotope-blue.com';

export const chatHistoryService = {
  // Fetch all chats for the current user
  fetchChats: async (): Promise<Chat[]> => {
    try {
      // Get chats from localStorage
      const storedChats = localStorage.getItem('mock_chats');
      const chats = storedChats ? JSON.parse(storedChats) : [];
      
      // Sort chats by updatedAt in descending order (newest first)
      return chats.sort((a: any, b: any) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    } catch (error) {
      console.error('Error fetching chats:', error);
      throw error;
    }
  },

  // Fetch messages for a specific chat
  fetchMessages: async (chatId: string): Promise<Message[]> => {
    try {
      // Get messages from localStorage or return empty array
      const storedChats = localStorage.getItem('mock_chats');
      if (!storedChats) return [];
      
      const chats = JSON.parse(storedChats);
      const chat = chats.find((c: any) => c.id === chatId);
      return chat?.messages || [];
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  },

  // Create a new chat
  createChat: async (title?: string): Promise<Chat> => {
    try {
      const newChat = {
        id: `chat_${Date.now()}`,
        title: title || 'New Chat',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: []
      };

      // Get existing chats and add new one
      const storedChats = localStorage.getItem('mock_chats');
      const chats = storedChats ? JSON.parse(storedChats) : [];
      chats.unshift(newChat);
      
      // Save updated chats
      localStorage.setItem('mock_chats', JSON.stringify(chats));
      localStorage.setItem('currentChatId', newChat.id);
      
      return newChat;
    } catch (error) {
      console.error('Error creating chat:', error);
      throw error;
    }
  },

  // Update chat title
  updateChatTitle: async (chatId: string, title: string): Promise<Chat> => {
    try {
      const storedChats = localStorage.getItem('mock_chats');
      if (!storedChats) {
        // Create a new chat if none exist
        const newChat = {
          id: chatId,
          title,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          messages: []
        };
        localStorage.setItem('mock_chats', JSON.stringify([newChat]));
        localStorage.setItem('currentChatId', chatId);
        return newChat;
      }
      
      let chats: any[] = JSON.parse(storedChats);
      
      // Find the chat to update
      let chatToUpdate: any = chats.find((c: any) => c.id === chatId);
      if (!chatToUpdate) {
        // Create a new chat if it doesn't exist
        chatToUpdate = {
          id: chatId,
          title,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          messages: []
        };
        chats.unshift(chatToUpdate);
        localStorage.setItem('currentChatId', chatId);
      } else {
        // Update existing chat
        chatToUpdate = {
          ...chatToUpdate,
          title,
          updatedAt: new Date().toISOString()
        };
        chats = chats.map((chat: any) => chat.id === chatId ? chatToUpdate : chat);
      }
      
      // Save all chats back to localStorage
      localStorage.setItem('mock_chats', JSON.stringify(chats));
      
      // Return the updated chat
      return chatToUpdate;
    } catch (error) {
      console.error('Error updating chat title:', error);
      throw error;
    }
  },

  // Delete a chat
  deleteChat: async (chatId: string): Promise<void> => {
    try {
      const storedChats = localStorage.getItem('mock_chats');
      if (!storedChats) return;

      const chats: any[] = JSON.parse(storedChats);
      const updatedChats = chats.filter((chat: any) => chat.id !== chatId);
      
      localStorage.setItem('mock_chats', JSON.stringify(updatedChats));
      
      // If we're deleting the current chat, select another one
      const currentChatId = localStorage.getItem('currentChatId');
      if (currentChatId === chatId) {
        const newCurrentChat = updatedChats[0];
        if (newCurrentChat) {
          localStorage.setItem('currentChatId', newCurrentChat.id);
        } else {
          localStorage.removeItem('currentChatId');
        }
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
      throw error;
    }
  },
};