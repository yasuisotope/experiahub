'use client';

import React from 'react';
import {
  Box,
  Button,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  Chat as ChatIcon,
  CalendarMonth as CalendarIcon,
  BookOnline as BookingIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useWordPressAuth } from '@/contexts/WordPressContext';
import { useChatContext } from '@/contexts/ChatContext';
import Image from 'next/image';
import SupportDialog from '@/components/support/SupportDialog';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';

interface UserLayoutProps {
  children: React.ReactNode;
}

export default function UserLayout({ children }: UserLayoutProps) {
  const router = useRouter();
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const { user, isLoggedIn, logout } = useWordPressAuth();
  const { 
    chats, 
    currentChat, 
    createNewChat, 
    selectChat, 
    updateChatTitle, 
    deleteChat,
    selectedExperience,
    setSelectedExperience
  } = useChatContext();

  const [userMenuAnchor, setUserMenuAnchor] = React.useState<null | HTMLElement>(null);
  const [chatMenuAnchor, setChatMenuAnchor] = React.useState<null | HTMLElement>(null);
  const [selectedChat, setSelectedChat] = React.useState<string | null>(null);
  const [renameDialogOpen, setRenameDialogOpen] = React.useState(false);
  const [newTitle, setNewTitle] = React.useState('');
  const [supportOpen, setSupportOpen] = React.useState(false);

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleChatMenuOpen = (event: React.MouseEvent<HTMLElement>, chatId: string) => {
    event.stopPropagation();
    setSelectedChat(chatId);
    setChatMenuAnchor(event.currentTarget);
  };

  const handleChatMenuClose = () => {
    setChatMenuAnchor(null);
    setSelectedChat(null);
  };

  const handleNewChat = async () => {
    await createNewChat();
    router.push('/chat');
  };

  const handleChatSelect = async (chatId: string) => {
    // Proactively close any open details and clear the query param
    try {
      setSelectedExperience(null);
      router.replace('/chat', { scroll: false });
    } catch {}
    await selectChat(chatId);
    router.push('/chat');
  };

  const handleRenameClick = () => {
    if (selectedChat) {
      const chat = chats.find((c) => c.id === selectedChat);
      if (chat) {
        setNewTitle(chat.title || '');
        setRenameDialogOpen(true);
        setChatMenuAnchor(null); // Close the menu but keep the selected chat
      }
    }
  };

  const handleRenameConfirm = async () => {
    if (!selectedChat || !newTitle.trim()) return;
    
    try {
      await updateChatTitle(selectedChat, newTitle.trim());
      // Refresh the chat list
      const storedChats = localStorage.getItem('mock_chats');
      if (storedChats) {
        const chats: Array<{ id: string; title?: string }> = JSON.parse(storedChats);
        const updatedChat = chats.find((c) => c.id === selectedChat);
        if (updatedChat) {
          console.log('Chat renamed successfully:', updatedChat.title);
        }
      }
    } catch (error) {
      console.error('Failed to rename chat:', error);
    } finally {
      setRenameDialogOpen(false);
      setNewTitle('');
      setSelectedChat(null);
    }
  };

  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const handleDeleteClick = async () => {
    if (!selectedChat) return;
    setConfirmOpen(true);
  };
  const handleConfirmDelete = async () => {
    if (selectedChat) {
      await deleteChat(selectedChat);
    }
    setConfirmOpen(false);
    handleChatMenuClose();
  };
  const handleCancelDelete = () => {
    setConfirmOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const handleProfile = () => {
    router.push('/profile');
    handleUserMenuClose();
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100dvh', height: '100dvh', position: 'relative', zIndex: 5 }}>
      {/* Left Sidebar */}
      <Box
        sx={{
          width: 280,
          bgcolor: 'rgba(1, 0, 87, 0.65)', // Dark Navy Glass
          backdropFilter: 'blur(12px)',
          borderRight: '1px solid',
          borderColor: 'rgba(255,255,255,0.1)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* Logo */}
        <Box sx={{ p: 2, pt: '35px', pb: '35px', textAlign: 'center' }}>
          <Image
            src="https://res.cloudinary.com/dasahamyc/image/upload/v1764230944/ExperiaHub_Logo_mqqw7z.png"
            alt="ExperiaHub"
            width={240}
            height={60}
            style={{ height: 'auto', filter: 'brightness(0) invert(1)' }} // Make white
            priority
          />
        </Box>

        {/* New Chat Button */}
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleNewChat}
          sx={{
            mx: 2,
            mb: 2,
            bgcolor: '#4A7C8C',
            color: '#fff',
            fontFamily: 'Nunito, sans-serif',
            justifyContent: 'flex-start',
            pl: 3,
            '&:hover': { bgcolor: '#5B8D9D' },
          }}
        >
          NEW CHAT
        </Button>

        {/* Navigation */}
        <List>
          <ListItem disablePadding>
            <ListItemButton 
              onClick={() => router.push('/chat')} 
              selected={pathname === '/chat'}
              sx={{
                '&.Mui-selected': { bgcolor: 'rgba(255, 255, 255, 0.12)' },
                '&.Mui-selected:hover': { bgcolor: 'rgba(255, 255, 255, 0.18)' },
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)' },
              }}
            >
              <ListItemIcon sx={{ color: pathname === '/chat' ? '#fff' : 'rgba(255,255,255,0.7)' }}>
                <ChatIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Chat" 
                primaryTypographyProps={{ fontFamily: 'Nunito, sans-serif', fontSize: '0.95rem', color: pathname === '/chat' ? '#fff' : 'rgba(255,255,255,0.7)' }}
              />
            </ListItemButton>
          </ListItem>
          {isLoggedIn && (
            <>
              <ListItem disablePadding>
                <ListItemButton 
                  onClick={() => router.push('/bookings')} 
                  selected={pathname.startsWith('/bookings')}
                  sx={{
                    '&.Mui-selected': { bgcolor: 'rgba(255, 255, 255, 0.12)' },
                    '&.Mui-selected:hover': { bgcolor: 'rgba(255, 255, 255, 0.18)' },
                    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)' },
                  }}
                >
                  <ListItemIcon sx={{ color: pathname.startsWith('/bookings') ? '#fff' : 'rgba(255,255,255,0.7)' }}>
                    <BookingIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Bookings"
                    primaryTypographyProps={{ fontFamily: 'Nunito, sans-serif', fontSize: '0.95rem', color: pathname.startsWith('/bookings') ? '#fff' : 'rgba(255,255,255,0.7)' }}
                  />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton 
                  onClick={() => router.push('/schedule')} 
                  selected={pathname.startsWith('/schedule')}
                  sx={{
                    '&.Mui-selected': { bgcolor: 'rgba(255, 255, 255, 0.12)' },
                    '&.Mui-selected:hover': { bgcolor: 'rgba(255, 255, 255, 0.18)' },
                    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)' },
                  }}
                >
                  <ListItemIcon sx={{ color: pathname.startsWith('/schedule') ? '#fff' : 'rgba(255,255,255,0.7)' }}>
                    <CalendarIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Schedule"
                    primaryTypographyProps={{ fontFamily: 'Nunito, sans-serif', fontSize: '0.95rem', color: pathname.startsWith('/schedule') ? '#fff' : 'rgba(255,255,255,0.7)' }}
                  />
                </ListItemButton>
              </ListItem>
            </>
          )}
          <ListItem disablePadding>
            <ListItemButton onClick={() => setSupportOpen(true)} sx={{ '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)' } }}>
              <ListItemIcon sx={{ color: 'rgba(255,255,255,0.7)' }}>
                <SupportAgentIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Contact Support" 
                primaryTypographyProps={{ fontFamily: 'Nunito, sans-serif', fontSize: '0.95rem', color: 'rgba(255,255,255,0.7)' }}
              />
            </ListItemButton>
          </ListItem>
        </List>

        <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.1)' }} />

        {/* Recent Chats - Always show */}
        <>
          <Typography variant="overline" sx={{ px: 2, color: 'rgba(255,255,255,0.5)', fontFamily: 'Nunito, sans-serif' }}>
            RECENT
          </Typography>
          <List sx={{ flexGrow: 1, overflow: 'auto' }}>
            {chats.length === 0 ? (
              <ListItem>
                <ListItemText primary="No recent conversations" primaryTypographyProps={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', fontFamily: 'Nunito, sans-serif' }} />
              </ListItem>
            ) : (
              chats.slice(0, 10).map((chat) => (
                <ListItem
                  key={chat.id}
                  disablePadding
                  secondaryAction={
                    <IconButton edge="end" onClick={(e) => handleChatMenuOpen(e, chat.id)} sx={{ color: 'rgba(255,255,255,0.7)' }}>
                      <MoreVertIcon />
                    </IconButton>
                  }
                >
                  <ListItemButton
                    onClick={() => handleChatSelect(chat.id)}
                    sx={{
                      borderRadius: 1.5,
                      mx: 1,
                      mb: 0.5,
                      transition: 'background-color 120ms ease',
                      bgcolor: currentChat?.id === chat.id ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.15)'
                      }
                    }}
                  >
                    <ListItemText 
                      primary={chat.title || 'New Chat'}
                      primaryTypographyProps={{
                        fontSize: '0.95rem',
                        fontWeight: currentChat?.id === chat.id ? 600 : 500,
                        color: currentChat?.id === chat.id ? '#fff' : 'rgba(255,255,255,0.85)',
                        noWrap: true,
                        fontFamily: 'Nunito, sans-serif',
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))
            )}
          </List>
        </>

        {/* Bottom actions */}
        <Box sx={{ p: 2, mt: 'auto' }}>
          {/* Login/Profile Button */}
          {isLoggedIn ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar
                onClick={handleUserMenuOpen}
                sx={{ 
                  cursor: 'pointer',
                  bgcolor: '#4A7C8C',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}
              >
                {user?.display_name?.[0] || user?.email?.[0]}
              </Avatar>
              <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                <Typography variant="subtitle2" noWrap sx={{ color: '#fff', fontFamily: 'Nunito, sans-serif' }}>
                  {user?.display_name || user?.email}
                </Typography>
              </Box>
            </Box>
          ) : (
            <Button
              fullWidth
              variant="contained"
              onClick={() => router.push('/login')}
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                color: '#fff',
                backdropFilter: 'blur(4px)',
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)' },
              }}
            >
              LOGIN
            </Button>
          )}
        </Box>
      </Box>
      
      {/* Main Content (no reserved right column; Chat page manages its own details grid) */}
      <Box sx={{ flexGrow: 1, bgcolor: 'transparent', height: '100dvh', overflow: 'hidden', position: 'relative', zIndex: 2 }}>
        <Box sx={{ overflow: 'hidden' }}>{children}</Box>
      </Box>

      {/* User Menu */}
      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={handleUserMenuClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            bgcolor: 'rgba(1, 0, 87, 0.9)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#fff',
            '& .MuiMenuItem-root': {
               fontFamily: 'Nunito, sans-serif',
               '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
            },
            '& .MuiListItemIcon-root': { color: 'rgba(255,255,255,0.7)' }
          }
        }}
      >
        <MenuItem onClick={handleProfile}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          Edit Profile
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>

      {/* Chat Menu */}
      <Menu
        anchorEl={chatMenuAnchor}
        open={Boolean(chatMenuAnchor)}
        onClose={handleChatMenuClose}
      >
        <MenuItem onClick={handleRenameClick}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          Rename
        </MenuItem>
        <MenuItem onClick={handleDeleteClick}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          Delete
        </MenuItem>
      </Menu>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onClose={() => setRenameDialogOpen(false)}>
        <DialogTitle>Rename Chat</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Chat Name"
            type="text"
            fullWidth
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleRenameConfirm} variant="contained" disabled={!newTitle.trim()}>
            Rename
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={confirmOpen} onClose={handleCancelDelete}>
        <DialogTitle>Delete this chat?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">This cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Support Dialog (chat context; bookingId unknown here) */}
      <SupportDialog open={supportOpen} onClose={()=>setSupportOpen(false)} defaultRole={isLoggedIn ? 'user' : 'user'} />
    </Box>
  );
}