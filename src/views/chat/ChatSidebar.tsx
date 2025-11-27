'use client';

import { useState, useEffect } from 'react';
// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { styled } from '@mui/material/styles';
import CircularProgress from '@mui/material/CircularProgress';

// third-party
import { IconMessage2, IconCalendar, IconClock, IconPlus } from '@tabler/icons-react';

// contexts
import { useWordPressAuth } from '@/contexts/WordPressContext';
import { useChatContext } from '@/contexts/ChatContext';

const StyledListItemButton = styled(ListItemButton)(({ theme }) => ({
  borderRadius: theme.spacing(1),
  marginBottom: theme.spacing(0.5),
  '&:hover': {
    backgroundColor: theme.palette.primary.light + '20'
  }
}));

const ChatSidebar = () => {
  const theme = useTheme();
  const [activeSection, setActiveSection] = useState('conversations');
  const { isLoggedIn, user } = useWordPressAuth();
  const { chats, loading, currentChat, selectChat, createNewChat } = useChatContext();

  const mainNavItems = [
    { id: 'conversations', icon: IconMessage2, label: 'Conversations' },
    { id: 'bookings', icon: IconCalendar, label: 'Bookings' },
    { id: 'schedule', icon: IconClock, label: 'Schedule' }
  ];

  // Format timestamp for display
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  const handleNewChat = async () => {
    try {
      await createNewChat();
    } catch (error) {
      console.error('Failed to create new chat:', error);
    }
  };

  const handleChatSelect = async (chatId: string) => {
    try {
      await selectChat(chatId);
    } catch (error) {
      console.error('Failed to select chat:', error);
    }
  };

  return (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column', 
      p: 2,
      bgcolor: theme.palette.background.paper
    }}>
      {/* New Chat Button */}
      <Button
        variant="contained"
        startIcon={<IconPlus size={20} />}
        fullWidth
        onClick={handleNewChat}
        sx={{
          mb: 3,
          py: 1,
          backgroundColor: theme.palette.primary.main,
          '&:hover': {
            backgroundColor: theme.palette.primary.dark
          }
        }}
      >
        New Chat
      </Button>

      {/* Main Navigation */}
      <List sx={{ mb: 2 }}>
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <ListItem key={item.id} disablePadding sx={{ mb: 1 }}>
              <StyledListItemButton
                selected={activeSection === item.id}
                onClick={() => setActiveSection(item.id)}
              >
                <ListItemIcon>
                  <Icon size={24} />
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </StyledListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* Recent Chats Section */}
      <Typography
        variant="subtitle2"
        sx={{
          px: 2,
          mb: 1,
          color: theme.palette.text.secondary,
          fontWeight: 500
        }}
      >
        Recent
      </Typography>

      <List sx={{ 
        flexGrow: 1, 
        overflow: 'auto',
        '& .MuiListItemButton-root': {
          borderRadius: 1
        }
      }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : chats.length > 0 ? (
          chats.map((chat) => (
            <ListItem key={chat.id} disablePadding>
              <StyledListItemButton
                selected={currentChat?.id === chat.id}
                onClick={() => handleChatSelect(chat.id)}
              >
                <ListItemText
                  primary={chat.title || 'Untitled Chat'}
                  secondary={formatTimestamp(chat.updatedAt)}
                  primaryTypographyProps={{
                    variant: 'body2',
                    color: 'textPrimary',
                    noWrap: true
                  }}
                  secondaryTypographyProps={{
                    variant: 'caption',
                    color: 'textSecondary'
                  }}
                />
              </StyledListItemButton>
            </ListItem>
          ))
        ) : (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="textSecondary">
              No recent conversations
            </Typography>
          </Box>
        )}
      </List>
    </Box>
  );
};

export default ChatSidebar;