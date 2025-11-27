import { useState } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Typography,
  useTheme
} from '@mui/material';
import { IconSend } from '@tabler/icons-react';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

const ChatInterface = () => {
  const theme = useTheme();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! How can I help you today?',
      isUser: false,
      timestamp: new Date()
    }
  ]);

  const handleSend = async () => {
    if (!message.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: message,
      isUser: true,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    setMessage('');

    // TODO: Integrate with n8n webhook
    try {
      // Placeholder for n8n integration
      const response = await fetch('your-n8n-webhook-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });

      const data = await response.json();
      
      // Add AI response
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response || 'Sorry, I encountered an error.',
        isUser: false,
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <Box sx={{ 
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: theme.palette.background.default
    }}>
      {/* Chat Messages */}
      <Box sx={{ 
        flexGrow: 1,
        overflow: 'auto',
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        gap: 2
      }}>
        {messages.map((msg) => (
          <Box
            key={msg.id}
            sx={{
              maxWidth: '80%',
              alignSelf: msg.isUser ? 'flex-end' : 'flex-start',
              bgcolor: msg.isUser 
                ? 'rgba(255, 183, 107, 0.9)' 
                : 'rgba(74, 124, 140, 0.9)',
              color: '#fff',
              p: 2,
              borderRadius: 2,
              position: 'relative'
            }}
          >
            <Typography variant="body1">
              {msg.content}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                position: 'absolute',
                bottom: -20,
                right: msg.isUser ? 0 : 'auto',
                left: msg.isUser ? 'auto' : 0,
                color: theme.palette.text.secondary
              }}
            >
              {msg.timestamp.toLocaleTimeString()}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Input Area */}
      <Box sx={{ 
        p: 2,
        borderTop: `1px solid ${theme.palette.divider}`,
        bgcolor: theme.palette.background.paper
      }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type your message..."
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: theme.palette.background.default
              }
            }}
          />
          <IconButton 
            color="primary"
            onClick={handleSend}
            disabled={!message.trim()}
            sx={{ alignSelf: 'flex-end' }}
          >
            <IconSend />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};

export default ChatInterface;