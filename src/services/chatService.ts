type Message = any;

// Use the proxy API route to avoid CORS issues
const CHAT_API_URL = '/api/chat';
const pendingRequests = new Map();
const REQUEST_TIMEOUT = 30000; // 30 seconds

// Debug: Log the actual URL being used
console.log('CHAT_API_URL:', CHAT_API_URL);

export interface ChatResponse {
  success: boolean;
  response?: {
    output: string;
    cta?: {
      type: string;
      label: string;
      url: string;
    } | null;
    experiences?: any[];
  };
  error?: string;
}

export const chatService = {
  sendMessage: async (message: string): Promise<ChatResponse> => {
    const sessionId = localStorage.getItem('sessionId');
    
    // Prevent duplicate requests
    if (pendingRequests.has(sessionId)) {
      throw new Error('A request is already in progress');
    }

    const requestId = Date.now().toString();
    pendingRequests.set(sessionId, requestId);

    // Set timeout to clear stuck states
    setTimeout(() => {
      if (pendingRequests.get(sessionId) === requestId) {
        pendingRequests.delete(sessionId);
      }
    }, REQUEST_TIMEOUT);

    try {
      console.log('Sending message to:', `${CHAT_API_URL}`);
      console.log('Request body:', { chatInput: message, sessionId, userId: sessionId });

      const response = await fetch(`${CHAT_API_URL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatInput: message,
          sessionId,
          userId: sessionId,
        }),
      });

      console.log('Response status:', response.status);
      const responseText = await response.text();
      console.log('Response text:', responseText);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}, body: ${responseText}`);
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse response as JSON:', e);
        throw new Error('Invalid response format from server');
      }

      console.log('Parsed response:', data);
      console.log('Response.output:', data.response);
      console.log('Response.cta:', data.cta);
      
      // Clear pending request
      pendingRequests.delete(sessionId);
      
      if (data.success && data.response) {
        return {
          success: true,
          response: {
            output: data.response,
            cta: data.cta || null,
            experiences: data.experiences || []
          }
        };
      } else if (data.output) {
        // Direct output format
        return {
          success: true,
          response: {
            output: data.output,
            cta: data.cta || null,
            experiences: data.experiences || []
          }
        };
      } else {
        throw new Error(data.error || 'Failed to get response from AI');
      }
    } catch (error) {
      console.error('Error in sendMessage:', error);
      pendingRequests.delete(sessionId);
      throw new Error(error instanceof Error ? error.message : 'Failed to connect to chat service. Please try again.');
    }
  },

  // Initialize chat session
  initSession: () => {
    let sessionId = localStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      localStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  },

  // Update session after user login
  updateSession: (userId: string) => {
    const newSessionId = `wp_${userId}`;
    localStorage.setItem('sessionId', newSessionId);
    return newSessionId;
  }
};