'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Chat, Message } from '@/types/chat';
import type { Experience } from '@/types/chat';
import { chatHistoryService } from '@/services/chatHistoryService';
import { chatService } from '@/services/chatService';
import { useWordPressAuth } from '@/contexts/WordPressContext';

interface ChatContextType {
  chats: Chat[];
  currentChat: Chat | null;
  loading: boolean;
  error: string | null;
  selectedExperience: Experience | null;
  setSelectedExperience: (e: Experience | null) => void;
  createNewChat: () => Promise<void>;
  selectChat: (chatId: string) => Promise<void>;
  sendMessage: (message: string) => Promise<void>;
  updateChatTitle: (chatId: string, title: string) => Promise<void>;
  deleteChat: (chatId: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useWordPressAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);

  // Initialize session and fetch chats on mount (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      chatService.initSession();
      
      const fetchChats = async () => {
        try {
          setLoading(true);
          const fetchedChats = await chatHistoryService.fetchChats();
          if (Array.isArray(fetchedChats) && fetchedChats.length > 0) {
            setChats(fetchedChats);
          } else {
            // No chats yet: seed a first chat so Recent is not empty
            const first = await chatHistoryService.createChat('New Chat');
            setChats([first]);
            setCurrentChat(first);
            localStorage.setItem('currentChatId', first.id);
            return; // early return; rest of logic will run on next mount/render
          }

          // Get currentChatId from localStorage
          const currentChatId = localStorage.getItem('currentChatId');
          if (currentChatId) {
            const found = fetchedChats.find(chat => chat.id === currentChatId);
            if (found) {
              setCurrentChat(found);
            } else if (fetchedChats.length > 0) {
              setCurrentChat(fetchedChats[0]);
              localStorage.setItem('currentChatId', fetchedChats[0].id);
            }
          } else if (fetchedChats.length > 0) {
            setCurrentChat(fetchedChats[0]);
            localStorage.setItem('currentChatId', fetchedChats[0].id);
          }
        } catch (err) {
          // Suppress error if it's just a connection issue
          if (!(err instanceof Error && err.message.includes('Failed to fetch'))) {
            setError(err instanceof Error ? err.message : 'Failed to fetch chats');
          }
        } finally {
          setLoading(false);
        }
      };

      // Always load chats from localStorage regardless of login state
      fetchChats();
    }
  }, []);

  const createNewChat = async () => {
    try {
      setLoading(true);
      // Reset any open details panel so the new chat starts fresh
      setSelectedExperience(null);
      const newChat = await chatHistoryService.createChat();
      setChats(prev => [newChat, ...prev]);
      setCurrentChat(newChat);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create new chat');
    } finally {
      setLoading(false);
    }
  };

  const selectChat = async (chatId: string) => {
    try {
      setLoading(true);
      // Ensure details panel is closed when switching chats
      setSelectedExperience(null);
      const messages = await chatHistoryService.fetchMessages(chatId);
      const chat = chats.find(c => c.id === chatId);
      if (chat) {
        setCurrentChat({ ...chat, messages });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to select chat');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (message: string) => {
    try {
      setLoading(true);
      setError(null);
      
      let chatToUse = currentChat;
      if (!chatToUse) {
        // Create a new chat if none exists
        chatToUse = await chatHistoryService.createChat();
        setChats(prev => [chatToUse!, ...prev]);
        setCurrentChat(chatToUse);
      }
      
      // Add user message immediately
      const newUserMessage: Message = {
        id: Date.now().toString(),
        content: message,
        isUser: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      // Auto-rename: use first user prompt as chat title
      try {
        const titleCandidate = message.trim().replace(/\s+/g, ' ').slice(0, 48);
        const activeId = currentChat?.id || localStorage.getItem('currentChatId');
        if (activeId && titleCandidate) {
          const stored = localStorage.getItem('mock_chats');
          let currentTitle: string | undefined = undefined;
          if (stored) {
            try {
              const arr: Array<{ id: string; title?: string }> = JSON.parse(stored);
              currentTitle = arr.find((c) => c.id === activeId)?.title;
            } catch {}
          }
          if (!currentTitle || currentTitle === 'New Chat') {
            await updateChatTitle(String(activeId), titleCandidate);
          }
        }
      } catch (e) {
        console.warn('Auto-rename failed:', e);
      }

      setCurrentChat(prev => {
        if (!prev) return null;
        return {
          ...prev,
          messages: [...(prev.messages || []), newUserMessage]
        };
      });

      // Send message and get AI response
      const response = await chatService.sendMessage(message);
      
      if (response.success && response.response) {
        const newAiMessage: Message = {
          id: Date.now().toString() + '-ai',
          content: response.response.output,
          isUser: false,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          // @ts-expect-error retain cta for UI even if not in type
          cta: response.response.cta || null
        };
        (newAiMessage as unknown as { experiences?: any[] }).experiences = response.response.experiences || [];

        setCurrentChat(prev => {
          if (!prev) return null;
          const updatedChat = {
            ...prev,
            messages: [...(prev.messages || []), newAiMessage],
            updatedAt: new Date().toISOString()
          };
          
          // Update the chat in localStorage
          const storedChats = localStorage.getItem('mock_chats');
          if (storedChats) {
            const chats: Array<{ id: string; messages?: any[]; [key: string]: any }> = JSON.parse(storedChats);
            const updatedChats = chats.map((chatItem) =>
              chatItem.id === updatedChat.id ? updatedChat : chatItem
            );
            localStorage.setItem('mock_chats', JSON.stringify(updatedChats));
            
            // Update the chats list state
            const normalizedChats = updatedChats.map((c: any) => ({
              id: String(c.id),
              title: c.title ?? 'New Chat',
              messages: Array.isArray(c.messages) ? c.messages : [],
              createdAt: c.createdAt ?? new Date().toISOString(),
              updatedAt: c.id === updatedChat.id ? updatedChat.updatedAt : (c.updatedAt ?? new Date().toISOString())
            }))
            // Re-sort newest first
            .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

            setChats(normalizedChats);
            // Persist normalized sorted list and active chat id
            localStorage.setItem('mock_chats', JSON.stringify(normalizedChats));
            localStorage.setItem('currentChatId', updatedChat.id);
            
            localStorage.setItem('currentChatId', updatedChat.id);
          } else {
            // No stored chats found in localStorage
          }
          
          return updatedChat;
        });

        // Update chats list with the latest messages
        if (currentChat) {
          setChats((prev) =>
            prev.map((chatItem) =>
              chatItem.id === currentChat.id
                ? { ...chatItem, messages: [...(chatItem.messages || []), newUserMessage, newAiMessage] }
                : chatItem
            )
          );
        }
      } else {
        throw new Error(response.error || 'Failed to get response');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      console.error('Error sending message:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateChatTitle = async (chatId: string, title: string) => {
    try {
      setLoading(true);
      await chatHistoryService.updateChatTitle(chatId, title);
      
      // Update chats list
      setChats(prevChats => 
        prevChats.map(chat => 
          chat.id === chatId ? { ...chat, title } : chat
        )
      );
      
      // Update current chat if needed
      if (currentChat?.id === chatId) {
        setCurrentChat(prev => prev ? { ...prev, title } : null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update chat title');
      throw err; // Re-throw to handle in component
    } finally {
      setLoading(false);
    }
  };

  const deleteChat = async (chatId: string) => {
    try {
      setLoading(true);
      await chatHistoryService.deleteChat(chatId);
      setChats(prev => prev.filter(chat => chat.id !== chatId));
      if (currentChat?.id === chatId) {
        const remainingChats = chats.filter(chat => chat.id !== chatId);
        setCurrentChat(remainingChats.length > 0 ? remainingChats[0] : null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete chat');
    } finally {
      setLoading(false);
    }
  };

  const value = {
    chats,
    currentChat,
    loading,
    error,
    selectedExperience,
    setSelectedExperience,
    createNewChat,
    selectChat,
    sendMessage,
    updateChatTitle,
    deleteChat,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
}