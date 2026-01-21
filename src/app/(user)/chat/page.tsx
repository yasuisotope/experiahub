'use client';
import React, { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import { Send as SendIcon } from '@mui/icons-material';
import { useChatContext } from '@/contexts/ChatContext';
import { useWordPressAuth } from '@/contexts/WordPressContext';
import '@fontsource/urbanist';
import DetailsPanel from '@/components/DetailsPanel';
import { track } from '@/services/analytics';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import BokunBookingWidget from '@/components/BokunBookingWidget';
import BookingOverlay from '@/components/booking/BookingOverlay';
import SupportDialog from '@/components/support/SupportDialog';
import Stack from '@mui/material/Stack';
// header removed (was AppBar) to avoid layout conflicts with MainLayout sidebars
import Fab from '@mui/material/Fab';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import WallpaperIcon from '@mui/icons-material/Wallpaper';
import ClearIcon from '@mui/icons-material/Clear';
import Logo from '@/ui-component/Logo';
import BackgroundImage from '@/components/BackgroundImage';
import { getUserBackground, loadCachedBackground, saveCachedBackground, searchUnsplash, setUserBackground, trackDownload, getCuratedBackgrounds, prefetchBackgroundImage } from '@/services/backgroundService';
import Skeleton from '@mui/material/Skeleton';
import Popover from '@mui/material/Popover';
import type { PortalBackground } from '@/services/backgroundService';
import { trackBackgroundChange, trackBackgroundRemove } from '@/services/analytics';

// Helper function to parse AI response and extract signup prompt
const parseAIResponse = (content: string) => {
  // Extract the signup URL regardless of surrounding text/line breaks
  const urlMatch = content.match(/https:\/\/app\.experiahub\.com\/signup\?next=\/chat&sid[^\s"']+/);
  const signupUrl = urlMatch ? urlMatch[0] : null;

  // Remove common signup lines regardless of punctuation/newlines
  let clean = content
    // Remove the lead-in line
    .replace(/To show photos, videos, pricing, schedules, and booking options, please create a free account\.[\s\S]*?/i, '')
    // Remove the Sign up here: line (up to line end)
    .replace(/Sign up here:[^\n\r]*/i, '')
    // Remove the return-to-chat sentence with straight or curly apostrophe
    .replace(/You(?:’|')ll return to this chat with your history saved\./i, '')
    // Remove the captured URL if still present anywhere
    .replace(/https:\/\/app\.experiahub\.com\/signup\?next=\/chat&sid[^\s"']+/g, '')
    // Tidy whitespace
    .replace(/\n{2,}/g, '\n')
    .replace(/\s{2,}/g, ' ')
    .trim();

  const hasSignupPrompt = Boolean(signupUrl);

  return {
    content: clean || content,
    signupUrl,
    hasSignupPrompt
  };
};

// Helper: synthesize experiences from plain text when backend array is missing
const synthesizeExperiences = (text: string) => {
  try {
    const textStr = String(text || '');
    const items: any[] = [];

    // Robust regex: match a number OR bullet followed by optional dot/space
    // We use [\s\S]+? to capture newlines.
    const re = /(?:^|\n|\s)(?:(\d{1,2})\.|[-•])\s*([\s\S]+?)(?=(?:\n\s*(?:\d{1,2}\.|[-•])\s*)|$)/g;
    let match: RegExpExecArray | null;
    while ((match = re.exec(textStr)) && items.length < 5) {
      const part = match[2].trim();
      const firstLine = part.split('\n')[0].trim();
      const title = firstLine || part || 'Experience';
      const cityMatch = part.match(/\(([^)]+)\)/);
      const city = cityMatch?.[1]?.trim();
      const durMatch = part.match(/(\d+(?:\.\d+)?)\s*hours?/i);
      const duration = durMatch?.[0];
      const summaryPart = part.split(/–|\u2013|•/).slice(1).join(' ').trim();
      const summary = summaryPart ? summaryPart.slice(0, 220) : undefined;
      items.push({ title, city, duration, summary });
    }

    // If nothing found inline, try per-line detection
    if (items.length === 0) {
      const lines = textStr.split('\n');
      for (let i = 0; i < lines.length && items.length < 5; i++) {
        const line = lines[i];
        const m = line.match(/^(?:(\d{1,2})\.|[-•])[\s-]*(.*)$/);
        if (m) {
          const titlePart = m[2] || '';
          const title = titlePart.split(/\(|•|–|\u2013/)[0].trim() || 'Experience';
          const cityMatch = titlePart.match(/\(([^)]+)\)/);
          const city = cityMatch?.[1]?.trim();
          const durMatch = titlePart.match(/(\d+(?:\.\d+)?)\s*hours?/i);
          const duration = durMatch?.[0];
          const next = (lines[i + 1] || '').trim();
          const summary = next ? next.replace(/^[–•]\s*/, '').slice(0, 220) : undefined;
          items.push({ title, city, duration, summary });
        }
      }
    }
    return items;
  } catch {
    return [];
  }
};

const stripEnumerationsFromText = (text: string) => {
  // Use the same regex logic to remove the blocks from the text
  return text.replace(/(?:^|\n|\s)(?:\d{1,2}\.|[-•])\s*[\s\S]+?(?=(?:\s+(?:\d{1,2}\.|[-•])\s*)|$)/g, '').trim();
};

const quickReplies = [
  'Best things to do in Tokyo',
  'Romantic dinner in Paris',
  'Outdoor adventures in Iceland',
  'Cultural tours in Rome'
];

export default function ChatPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { currentChat, sendMessage, loading } = useChatContext();
  const { user, isLoggedIn, login, isLoading: authLoading } = useWordPressAuth();
  
  const [input, setInput] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [selectedExperience, setSelectedExperience] = useState<any>(null);
  const [isOpening, setIsOpening] = useState(false);
  const closingRef = useRef(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [listWidgetOpen, setListWidgetOpen] = useState(false);
  const [listWidgetProductId, setListWidgetProductId] = useState<string | null>(null);
  const [bookingExperience, setBookingExperience] = useState<any>(null);
  const [supportOpen, setSupportOpen] = useState(false);

  // Background picker states
  const [bgAnchorEl, setBgAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [bgLoading, setBgLoading] = useState(false);
  const [bgResults, setBgResults] = useState<any[]>([]);
  const [bgSearch, setBgSearch] = useState('');
  const [bgPage, setBgPage] = useState(1);
  const [bgLoadingMore, setBgLoadingMore] = useState(false);
  const [bg, setBg] = useState<PortalBackground | null>(null);
  const [bgSeed, setBgSeed] = useState(0);

  const curatedList = React.useMemo(() => {
    if (bgSearch.trim()) return [] as ReturnType<typeof getCuratedBackgrounds>;
    const list = getCuratedBackgrounds();
    return list.slice().sort(() => Math.random() - 0.5);
  }, [bgSearch, bgSeed]);

  const [isTranslucent, setIsTranslucent] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      if (typeof e.detail?.isTransparent === 'boolean') {
        setIsTranslucent(e.detail.isTransparent);
      }
    };
    window.addEventListener('ui:transparency', handler as EventListener);
    return () => window.removeEventListener('ui:transparency', handler as EventListener);
  }, []);

  // When opening the background picker with no query, fetch fresh random results
  useEffect(() => {
    (async () => {
      if (!bgAnchorEl) return;
      if (bgSearch.trim()) return;
      try {
        setBgLoading(true);
        const topics = ['nature','city','ocean','mountains','forest','sky','beach','night','sunset','architecture'];
        const q = topics[Math.floor(Math.random() * topics.length)];
        const results = await searchUnsplash(q, 1, 30);
        setBgResults(Array.isArray(results) ? results : []);
        setBgPage(1);
      } finally {
        setBgLoading(false);
      }
    })();
  }, [bgAnchorEl, bgSeed, bgSearch]);

  // Detect opening transition and handle query params
  useEffect(() => {
    if (selectedExperience) {
      setIsOpening(true);
      const pid = (selectedExperience as any)?.bokunProductId || (selectedExperience as any)?.productId || (selectedExperience as any)?.id;
      track('details_open', { title: selectedExperience.title, city: (selectedExperience as any)?.city, category: (selectedExperience as any)?.category, productId: pid });
      const t = setTimeout(() => setIsOpening(false), 600);
      try {
        const title = encodeURIComponent(selectedExperience.title || 'exp');
        router.replace(`${pathname}?exp=${title}`, { scroll: false });
      } catch {}
      return () => clearTimeout(t);
    }
    track('details_close', { reason: 'panel_closed' });
    try {
      if (pathname) router.replace(pathname, { scroll: false });
    } catch {}
    return;
  }, [selectedExperience]);

  // On route change (or first load), open details if exp param exists
  useEffect(() => {
    const expParam = searchParams?.get('exp');
    if (closingRef.current) return;
    if (!expParam || selectedExperience) return;
    const titleToFind = decodeURIComponent(expParam);
    try {
      const messages = currentChat?.messages || [];
      for (const m of messages) {
        const list = (!m.isUser && Array.isArray((m as any).experiences)) ? (m as any).experiences : [];
        const found = list?.find((e: any) => (e?.title || '').toLowerCase() === titleToFind.toLowerCase());
        if (found) { setSelectedExperience(found); break; }
      }
    } catch {}
  }, [searchParams, currentChat?.messages, setSelectedExperience, selectedExperience]);

  const handleCloseDetails = React.useCallback(() => {
    try {
      closingRef.current = true;
      if (pathname) router.replace(pathname, { scroll: false });
      setSelectedExperience(null);
    } finally {
      setTimeout(() => { closingRef.current = false; }, 0);
    }
  }, [pathname, router, setSelectedExperience]);

  // Listen for availability requests from DetailsPanel
  useEffect(() => {
    const handler = (e: any) => {
      const msg = e?.detail?.message;
      if (typeof msg === 'string' && msg.trim() && !loading) {
        sendMessage(msg).catch(() => {});
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('chat:send', handler as EventListener);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('chat:send', handler as EventListener);
      }
    };
  }, [sendMessage, loading]);

  useEffect(() => {
    const close = () => setSelectedExperience(null);
    if (typeof window !== 'undefined') window.addEventListener('details:close', close);
    return () => {
      if (typeof window !== 'undefined') window.removeEventListener('details:close', close);
    };
  }, [setSelectedExperience]);

  useEffect(() => {
    const loadBg = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('wp_token') : null;
        const cached = loadCachedBackground('chat');
        if (cached) setBg(cached);
        const server = await getUserBackground(token);
        if (server) { setBg(server); saveCachedBackground(server, 'chat'); }
      } catch {}
    };
    loadBg();
  }, [isLoggedIn]);

  const handleUpdateBackground = async (p: PortalBackground) => {
    try {
      setBg(p);
      setBgAnchorEl(null);
      saveCachedBackground(p, 'chat');
      const token = typeof window !== 'undefined' ? localStorage.getItem('wp_token') : null;
      if (token) {
        await setUserBackground(token, p);
      }
      trackBackgroundChange(p.url || '');
    } catch (e) {
      console.error('BG Change Error:', e);
    }
  };

  // Auto-scroll to bottom when messages or loading state change
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      try {
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
      } catch {
        (el as any).scrollTop = (el as any).scrollHeight;
      }
    });
  }, [currentChat?.messages?.length, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading || isSending) return;
    
    try {
      const message = input.trim();
      setInput(''); 
      setIsSending(true);
      await sendMessage(message);
    } catch (error) {
      console.error('Failed to send message:', error);
      setInput(input.trim());
    } finally {
      setIsSending(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    
    try {
      setIsLoggingIn(true);
      setLoginError('');
      await login(username, password);
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const showWidgetCta = true; // Temporary toggle or logic

  return (
    <BackgroundImage imageUrl={bg?.url} lqip={bg?.lqip} attribution={{ authorName: bg?.authorName, authorUrl: bg?.authorUrl }} overlayOpacity={0}>
      <Box sx={{ position: 'relative' }}>
        
        {/* Loading State */}
        {authLoading && (
          <Box
            sx={{
              height: '100dvh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.25)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <CircularProgress size={32} sx={{ color: 'rgba(74, 124, 140, 0.9)' }} />
          </Box>
        )}

        {/* Login State */}
        {!isLoggedIn && !authLoading && (
          <Box
            sx={{
              height: '100dvh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.25)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <Paper
              elevation={0}
              sx={{
                p: 4,
                width: '100%',
                maxWidth: 400,
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                borderRadius: '16px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              }}
            >
              <Box component="form" onSubmit={handleLogin} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <Typography variant="h4" component="h2" sx={{ m: 0, color: '#010057', fontFamily: 'Urbanist', fontWeight: 600 }}>
                    Welcome to ExperiaHub
                  </Typography>
                  <Typography sx={{ mt: 1, color: '#666', fontFamily: 'Urbanist' }}>
                    Please log in to start chatting
                  </Typography>
                </Box>
                
                <TextField
                  label="Username"
                  fullWidth
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoggingIn}
                  sx={{ '& .MuiOutlinedInput-root': { fontFamily: 'Urbanist' } }}
                />
                
                <TextField
                  label="Password"
                  type="password"
                  fullWidth
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoggingIn}
                  sx={{ '& .MuiOutlinedInput-root': { fontFamily: 'Urbanist' } }}
                />
                
                {loginError && (
                  <Typography sx={{ color: '#d32f2f', fontSize: '0.875rem', fontFamily: 'Urbanist', textAlign: 'center' }}>
                    {loginError}
                  </Typography>
                )}
                
                <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                  <Button
                    type="submit"
                    fullWidth
                    disabled={isLoggingIn || !username.trim() || !password.trim()}
                    sx={{
                      py: 1.5,
                      bgcolor: '#010057',
                      color: 'white',
                      fontFamily: 'Urbanist',
                      textTransform: 'none',
                      fontSize: '1rem',
                      '&:hover': { bgcolor: '#010057' },
                      '&:disabled': { bgcolor: 'rgba(0, 0, 0, 0.12)' },
                    }}
                  >
                    {isLoggingIn ? 'Logging in...' : 'Log In'}
                  </Button>
                  
                  <Button
                    component="a"
                    href="https://experiahub.com/signup/"
                    target="_blank"
                    fullWidth
                    sx={{
                      py: 1.5,
                      color: '#010057',
                      borderColor: '#010057',
                      borderWidth: 1,
                      borderStyle: 'solid',
                      fontFamily: 'Urbanist',
                      textTransform: 'none',
                      fontSize: '1rem',
                      '&:hover': { bgcolor: 'rgba(1, 0, 87, 0.1)', borderWidth: 1 },
                    }}
                  >
                    Sign Up
                  </Button>
                </Box>
              </Box>
            </Paper>
          </Box>
        )}


        {/* Chat Interface (Logged In) */}
        {isLoggedIn && !authLoading && (
        <Box sx={{ 
        display: { xs: 'block', md: 'grid' }, 
        gridTemplateColumns: { md: selectedExperience ? 'minmax(0,1fr) 420px' : 'minmax(0,1fr) 0px' },
        transition: 'grid-template-columns 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        height: '100%', // Changed from 100dvh to fit in layout
        position: 'relative' // Ensure positioning context
      }}>
        {/* Left column: messages + input */}
        <Box sx={{ 
          display: 'grid',
          gridTemplateRows: '1fr auto',
          minWidth: 0,
          minHeight: 0,
          height: '100%', // Changed from 100dvh to fit in layout
          overflow: 'hidden',
          width: '100%',
          maxWidth: { md: selectedExperience ? '100%' : 760 },
          mx: 'auto',
          transition: `${isOpening ? '520ms' : '420ms'} cubic-bezier(.22,.61,.36,1)`,
          transitionProperty: 'max-width'
        }}>
          {/* Inline header row for chat list area */}
          <Box ref={messagesContainerRef as any} sx={{ 
          overflowY: 'auto', 
            p: { xs: 1, sm: 2 },
          display: 'flex',
          flexDirection: 'column',
            gap: { xs: 1, sm: 2 }
          }}>
          {(!currentChat?.messages || currentChat.messages.length === 0) && (
            <Box sx={{ p: { xs: 1, sm: 2 }, display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
              {quickReplies.map((q) => (
                <Button 
                  key={q} 
                  size="small" 
                  variant="text" 
                  onClick={() => { track('quick_reply_click', { query: q }); if (!loading) { sendMessage(q).catch(() => {}); } }} 
                  sx={{ 
                    textTransform: 'none', 
                    bgcolor: 'rgba(255,255,255,0.7)', 
                    backdropFilter: 'blur(8px)',
                    color: '#333',
                    border: '1px solid rgba(255,255,255,0.8)',
                    borderRadius: '12px',
                    fontFamily: 'Urbanist',
                    px: 2,
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.9)', borderColor: '#fff' }
                  }}
                >
                  {q}
                </Button>
              ))}
            </Box>
          )}
          {currentChat?.messages?.map((message) => {
            const parsedResponse = !message.isUser ? parseAIResponse(message.content) : null;
            const displayContent = parsedResponse ? parsedResponse.content : message.content;
            const finalSignupUrl = parsedResponse?.signupUrl;
            const showSignup = Boolean(finalSignupUrl);

            const structuredList = (!message.isUser && Array.isArray((message as any).experiences)) ? (message as any).experiences : [];
            const synthesizedList = (!message.isUser && (!structuredList || structuredList.length === 0)) ? synthesizeExperiences(displayContent) : [];
            const experienceList: any[] = (Array.isArray(structuredList) && structuredList.length > 0) ? structuredList : synthesizedList;

            return (
              <Box key={message.id} sx={{ display: 'flex', justifyContent: message.isUser ? 'flex-end' : 'flex-start', mb: 1 }}>
                <Box sx={{ maxWidth: '80%', display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      backgroundColor: message.isUser 
                        ? (isTranslucent ? 'rgba(1, 0, 87, 0.4)' : '#010057') 
                        : (isTranslucent ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.95)'),
                      backdropFilter: isTranslucent ? 'blur(12px)' : 'none',
                      color: message.isUser ? '#ffffff' : '#010057',
                      borderRadius: '16px',
                      border: isTranslucent ? '1px solid rgba(255,255,255,0.1)' : 'none',
                      ...(message.isUser ? { borderBottomRightRadius: '4px' } : { borderBottomLeftRadius: '4px' }),
                      fontFamily: 'Urbanist',
                      fontSize: '1rem',
                      lineHeight: 1.6,
                    }}
                  >
                    {((Array.isArray(experienceList) && experienceList.length > 0 && !message.isUser))
                      ? stripEnumerationsFromText(displayContent)
                      : displayContent}
                  </Paper>
                  {!message.isUser && Array.isArray(experienceList) && experienceList.length > 0 && (
                    <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {experienceList.slice(0,5).map((exp: any, i: number) => (
                        <Paper key={i} elevation={0} sx={{ p: 1.5, backgroundColor: isTranslucent ? 'rgba(255,255,255,0.7)' : '#fff', backdropFilter: isTranslucent ? 'blur(8px)' : 'none', border: '1px solid rgba(1, 0, 87, 0.1)', borderRadius: '10px' }}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <Box sx={{ fontFamily: 'Urbanist', color: '#010057', fontSize: '0.95rem', fontWeight: 500 }}>
                              {`${i+1}. ${exp?.title || 'Experience'}`}
                            </Box>
                            <Box sx={{ fontFamily: 'Urbanist', color: '#64748B', fontSize: '0.85rem' }}>
                              {[exp?.city, exp?.category, exp?.duration].filter(Boolean).join(' • ')}
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                              <Button size="small" variant="outlined" onClick={() => setSelectedExperience(exp)} sx={{ textTransform: 'none', color: '#010057', borderColor: '#010057', fontFamily: 'Urbanist' }}>Details</Button>
                              {(exp?.bokunProductId || (exp?.id && !String(exp.id).startsWith('temp_'))) && (
                                <Button size="small" variant="contained" onClick={() => { setBookingExperience(exp); setListWidgetOpen(true); }} sx={{ textTransform: 'none', bgcolor: '#010057', fontFamily: 'Urbanist', '&:hover': { bgcolor: '#010057' } }}>Check availability</Button>
                              )}
                            </Box>
                          </Box>
                        </Paper>
                      ))}
                    </Box>
                  )}
                  {!message.isUser && showSignup && (
                    <Box sx={{ mt: 1 }}>
                      <Button variant="contained" href={finalSignupUrl as string} target="_blank" sx={{ bgcolor: '#ffbf00', color: '#010057', '&:hover': { bgcolor: '#e6ac00' } }}>Create Free Account</Button>
                    </Box>
                  )}
                </Box>
              </Box>
            );
          })}
          {(loading || isSending) && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 1, flexDirection: 'column', gap: 1 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 1.5,
                  px: 2,
                  backgroundColor: isTranslucent ? 'rgba(255, 255, 255, 0.6)' : '#E9F0F3',
                  backdropFilter: isTranslucent ? 'blur(12px)' : 'none',
                  border: isTranslucent ? '1px solid rgba(255,255,255,0.1)' : 'none',
                  color: '#010057',
                  borderRadius: '16px',
                  borderBottomLeftRadius: '4px',
                }}
              >
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Box sx={{ display: 'inline-flex', gap: 0.6 }}>
                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#010057', animation: 'blink 1.2s infinite' }} />
                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#010057', animation: 'blink 1.2s 0.2s infinite' }} />
                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#010057', animation: 'blink 1.2s 0.4s infinite' }} />
                  </Box>
                  <Typography variant="body2" sx={{ fontFamily: 'Urbanist', color: '#010057', fontStyle: 'italic', ml: 1 }}>
                    ExperiaHub is thinking...
                  </Typography>
                </Box>
                <style jsx>{`
                  @keyframes blink {
                    0% { opacity: 0.2; transform: translateY(0px); }
                    50% { opacity: 1; transform: translateY(-2px); }
                    100% { opacity: 0.2; transform: translateY(0px); }
                  }
                `}</style>
              </Paper>
            </Box>
          )}
        </Box>

        <Box sx={{ px: 1, pt: 1, pb: { xs: '30px', md: '30px' }, background: 'transparent' }}>
          <TextField
            fullWidth
            placeholder="How can I help you today?"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            disabled={loading}
            sx={{
              '& .MuiOutlinedInput-root': {
                height: '44px',
                borderRadius: '22px',
                backgroundColor: 'rgba(255, 255, 255, 0.98)',
                '& fieldset': { borderColor: 'rgba(1, 0, 87, 0.15)' },
                '&:hover fieldset': { borderColor: '#010057 !important' },
                '&.Mui-focused fieldset': { borderColor: '#010057 !important' },
              }
            }}
            InputProps={{
              endAdornment: (
                <IconButton onClick={handleSend} disabled={!input.trim()} sx={{ color: input.trim() ? '#010057' : '#ccc' }}>
                  <SendIcon />
                </IconButton>
              ),
            }}
          />
        </Box>
      </Box>

      <Box
        sx={{
          display: { xs: 'none', md: 'block' },
          width: { md: selectedExperience ? '420px' : 0 },
          minWidth: 0,
          transition: 'width 420ms cubic-bezier(.22,.61,.36,1), opacity 360ms ease-in-out, transform 360ms ease-in-out',
          opacity: selectedExperience ? 1 : 0,
          transform: selectedExperience ? 'translateY(0)' : 'translateY(8px)',
          transitionDelay: selectedExperience ? (isOpening ? '140ms' : '90ms') : '0ms',
          willChange: 'opacity, transform',
          pointerEvents: selectedExperience ? 'auto' : 'none',
          overflowY: 'auto',
          height: '100dvh'
        }}
      >
        <DetailsPanel 
          exp={selectedExperience} 
          onClose={handleCloseDetails} 
          onBook={(exp: any) => {
            setBookingExperience(exp);
            setListWidgetOpen(true);
          }}
        />
      </Box>

      {/* Background Picker Button (Added back per request) */}
      <Fab
        color="default"
        size="small"
        onClick={(e) => { setBgSeed((s)=>s+1); setBgAnchorEl(e.currentTarget); }}
        sx={{ 
          position: 'fixed', 
          right: 20, 
          bottom: 24, 
          zIndex: 2000, 
          bgcolor: 'rgba(255,255,255,0.9)', 
          color: '#010057',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}
      >
        <WallpaperIcon fontSize="small" />
      </Fab>
    </Box>
    )}

    <BookingOverlay
      open={listWidgetOpen}
      onClose={() => setListWidgetOpen(false)}
      productId={String(bookingExperience?.bokunProductId || bookingExperience?.productId || bookingExperience?.id || '')}
      experienceTitle={bookingExperience?.title}
    />
    <SupportDialog open={supportOpen} onClose={()=>setSupportOpen(false)} defaultRole="user" />
    
    <Popover
      open={Boolean(bgAnchorEl)}
      anchorEl={bgAnchorEl}
      onClose={() => { setBgAnchorEl(null); setBgSeed(0); }}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Paper
        sx={{ p: 2, width: 360, maxHeight: 420, overflowY: 'auto', borderRadius: 3 }}
        onScroll={async (e:any)=>{
          try {
            if (!bgSearch.trim() || bgLoadingMore) return;
            const el = e.currentTarget as HTMLElement;
            const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 48;
            if (!nearBottom) return;
            setBgLoadingMore(true);
            const next = bgPage + 1;
            const more = await searchUnsplash(bgSearch.trim(), next, 30);
            const existing = new Set((bgResults||[]).map((x:any)=>x?.id));
            const merged = [...bgResults, ...more.filter((x:any)=> !existing.has(x?.id))];
            setBgResults(merged);
            setBgPage(next);
          } finally { setBgLoadingMore(false); }
        }}
      >
        <Stack spacing={1}>
          <Stack direction="row" spacing={1}>
            <TextField
              size="small"
              label="Search photos"
              value={bgSearch}
              onChange={(e) => {
                const v = e.target.value;
                setBgSearch(v);
                if (!v.trim()) { setBgResults([]); setBgPage(1); setBgSeed(s => s + 1); }
              }}
              fullWidth
              onKeyDown={(e) => {
                if (e.key === 'Enter' && bgSearch.trim()) {
                  e.preventDefault();
                  (async () => {
                    try {
                      setBgLoading(true);
                      const results = await searchUnsplash(bgSearch.trim(), 1, 30);
                      setBgResults(Array.isArray(results) ? results : []);
                      setBgPage(1);
                    } finally { setBgLoading(false); }
                  })();
                }
              }}
              InputProps={{
                endAdornment: bgSearch ? (
                  <IconButton size="small" aria-label="Clear" onClick={() => { setBgSearch(''); setBgResults([]); setBgPage(1); setBgSeed(s => s + 1); }}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                ) : null
              }}
            />
            <Button size="small" variant="outlined" disabled={bgLoading || !bgSearch.trim()} sx={{ fontFamily: 'Urbanist', borderColor: 'rgba(1,0,87,0.5)', color: '#010057', fontWeight: 500, borderRadius: 3 }} onClick={async ()=>{
              try {
                setBgLoading(true);
                const results = await searchUnsplash(bgSearch.trim(), 1, 30);
                setBgResults(Array.isArray(results)?results:[]);
                setBgPage(1);
              } finally { setBgLoading(false); }
            }}>Go</Button>
          </Stack>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
            {(!bgSearch.trim() && bgResults.length === 0 ? curatedList : []).map((p, idx)=> (
              <Box
                key={`cur_${idx}`}
                role="button"
                tabIndex={0}
                sx={{ cursor: 'pointer', borderRadius: 2, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.08)' }}
                onClick={() => handleUpdateBackground(p)}
              >
                <img src={p.thumbUrl || p.url} alt="" loading="lazy" style={{ width: '100%', height: 72, objectFit: 'cover', display: 'block' }} />
              </Box>
            ))}
            {bgResults.map((p:any)=>{
              const id = p?.id; const url = p?.urls?.full || p?.urls?.regular || ''; const thumb = p?.urls?.small || p?.urls?.thumb || '';
              const authorName = p?.user?.name || ''; const authorUrl = p?.user?.links?.html || p?.user?.portfolio_url || '';
              return (
                <Box
                  key={id}
                  role="button"
                  tabIndex={0}
                  sx={{ cursor: 'pointer', borderRadius: 2, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.08)' }}
                  onClick={() => handleUpdateBackground({ id, url, thumbUrl: thumb, authorName, authorUrl })}
                >
                  <img src={thumb} alt={authorName} style={{ width: '100%', height: 72, objectFit: 'cover', display: 'block' }} />
                </Box>
              );
            })}
          </Box>
          {(bgLoading || bgLoadingMore) && (<Skeleton variant="rectangular" height={60} />)}
          <Button size="small" color="error" variant="outlined" sx={{ fontFamily: 'Nunito, sans-serif', textTransform: 'none', borderRadius: 2 }} onClick={async ()=>{
            const token = typeof window !== 'undefined' ? localStorage.getItem('wp_token') : null;
            setBg(null); saveCachedBackground(null, 'chat');
            try { await setUserBackground(token, null as any); } catch {}
          }}>Remove Background</Button>
        </Stack>
      </Paper>
    </Popover>
    <Fab onClick={()=>setSupportOpen(true)} sx={{ position: 'fixed', right: 20, bottom: 92, bgcolor: '#fff', color: '#010057' }}>
      <SupportAgentIcon />
    </Fab>

    </Box>
  </BackgroundImage>
  );
}