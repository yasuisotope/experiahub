'use client';
import React, { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Box from '@mui/material/Box';
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
import SupportDialog from '@/components/support/SupportDialog';
import Stack from '@mui/material/Stack';
// header removed (was AppBar) to avoid layout conflicts with MainLayout sidebars
import Fab from '@mui/material/Fab';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import BackgroundImage from '@/components/BackgroundImage';
import { getUserBackground, loadCachedBackground, saveCachedBackground, searchUnsplash, setUserBackground, trackDownload, getCuratedBackgrounds, prefetchBackgroundImage, type PortalBackground } from '@/services/backgroundService';
import { trackBackgroundChange, trackBackgroundRemove } from '@/services/analytics';
import Popover from '@mui/material/Popover';
import Skeleton from '@mui/material/Skeleton';
import WallpaperIcon from '@mui/icons-material/Wallpaper';
import ClearIcon from '@mui/icons-material/Clear';

// analytics centralized in services/analytics

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

    // Inline enumeration parser: "1. Foo … 2. Bar …"
    const inlineRe = /(\d{1,2})\.\s*([^]+?)(?=(?:\s+\d{1,2}\.\s*)|$)/g;
    let match: RegExpExecArray | null;
    while ((match = inlineRe.exec(textStr)) && items.length < 5) {
      const part = match[2].trim();
      const title = part.split(/\(|•|–|\u2013/)[0].trim() || 'Experience';
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
        const m = line.match(/^(\d{1,2})\.[\s-]*(.*)$/);
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
  let s = String(text || '');
  s = s.replace(/\n?\s*Here are a few options:?/gi, '');
  s = s.replace(/\n?\s*Ask for details by number,? or try another city\/category\.?/gi, '');
  s = s.replace(/(^|\n)\s*\d{1,2}\.[^\n]*/g, '');
  s = s.replace(/\s{2,}/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  return s;
};

export default function ChatPage() {
  const [input, setInput] = useState('');
  const { sendMessage, loading, currentChat, selectedExperience, setSelectedExperience } = useChatContext();
  const { isLoggedIn, login, isLoading: authLoading } = useWordPressAuth();
  const [bg, setBg] = useState<PortalBackground | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const [isOpening, setIsOpening] = useState(false);
  const closingRef = useRef(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const quickReplies = ['Kyoto tea ceremony', 'Paris workshops', 'Family‑friendly', 'Food tours', 'Museums'];
  const [listWidgetOpen, setListWidgetOpen] = React.useState(false);
  const [listWidgetProductId, setListWidgetProductId] = React.useState<string | null>(null);
  const showWidgetCta = (process.env.NEXT_PUBLIC_SHOW_WIDGET_CTA ?? process.env.SHOW_WIDGET_CTA ?? 'true') !== 'false';
  const [supportOpen, setSupportOpen] = React.useState(false);
  const [bgAnchorEl, setBgAnchorEl] = useState<HTMLElement | null>(null);
  const [bgSearch, setBgSearch] = useState<string>('');
  const [bgResults, setBgResults] = useState<any[]>([]);
  const [bgPage, setBgPage] = useState<number>(1);
  const [bgLoading, setBgLoading] = useState<boolean>(false);
  const [bgLoadingMore, setBgLoadingMore] = useState<boolean>(false);
  const [bgSeed, setBgSeed] = useState<number>(0);
  const curatedList = React.useMemo(() => {
    if (bgSearch.trim()) return [] as ReturnType<typeof getCuratedBackgrounds>;
    const list = getCuratedBackgrounds();
    return list.slice().sort(() => Math.random() - 0.5);
  }, [bgSearch, bgSeed]);

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

  // Detect opening transition (left-only -> left+right) to slow it down explicitly
  useEffect(() => {
    if (selectedExperience) {
      setIsOpening(true);
      const pid = (selectedExperience as any)?.bokunProductId || (selectedExperience as any)?.productId || (selectedExperience as any)?.id;
      track('details_open', { title: selectedExperience.title, city: (selectedExperience as any)?.city, category: (selectedExperience as any)?.category, productId: pid });
      const t = setTimeout(() => setIsOpening(false), 600);
      // push exp param for deep-link
      try {
        const title = encodeURIComponent(selectedExperience.title || 'exp');
        router.replace(`${pathname}?exp=${title}`, { scroll: false });
      } catch {}
      return () => clearTimeout(t);
    }
    // remove exp param when closing
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
      // ensure we drop the panel immediately
      setSelectedExperience(null);
    } finally {
      // release the flag on next tick to allow future deep-links
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
        const cached = loadCachedBackground('user');
        if (cached) setBg(cached);
        const server = await getUserBackground(token);
        if (server) { setBg(server); saveCachedBackground(server, 'user'); }
      } catch {}
    };
    loadBg();
  }, []);

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
    if (!input.trim() || loading) return;
    
    try {
      console.log('Sending message:', input.trim());
      const message = input.trim();
      setInput(''); // Clear input immediately for better UX
      await sendMessage(message);
    } catch (error) {
      console.error('Failed to send message:', error);
      setInput(input.trim()); // Restore input if send fails
      // Error will be shown via the Snackbar from ChatContext
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

  // Show login form if not logged in
  if (!isLoggedIn && !authLoading) {
    return (
      <Box
        sx={{
          height: 'calc(100vh - 32px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '12px',
          maxWidth: 800,
          margin: '0 auto',
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
          }}
        >
          <Box component="form" onSubmit={handleLogin} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <h2 style={{ margin: 0, color: '#4a7c8c', fontFamily: 'Cormorant Garamond' }}>
                Welcome to ExperiaHub Chat
              </h2>
              <p style={{ margin: '8px 0 0 0', color: '#666666', fontFamily: 'Urbanist' }}>
                Please log in to start chatting
              </p>
            </Box>
            
            <TextField
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoggingIn}
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontFamily: 'Urbanist',
                },
              }}
            />
            
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoggingIn}
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontFamily: 'Urbanist',
                },
              }}
            />
            
            {loginError && (
              <Box sx={{ color: '#d32f2f', fontSize: '0.875rem', fontFamily: 'Urbanist' }}>
                {loginError}
              </Box>
            )}
            
            <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
              <Box
                component="button"
                type="submit"
                disabled={isLoggingIn || !username.trim() || !password.trim()}
                sx={{
                  flex: 1,
                  py: 1.5,
                  px: 3,
                  backgroundColor: 'rgba(74, 124, 140, 0.9)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontFamily: 'Urbanist',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: 'rgba(74, 124, 140, 1)',
                  },
                  '&:disabled': {
                    backgroundColor: 'rgba(0, 0, 0, 0.12)',
                    cursor: 'not-allowed',
                  },
                }}
              >
                {isLoggingIn ? 'Logging in...' : 'Log In'}
              </Box>
              
              <Box
                component="a"
                href="https://experiahub.com/signup/"
                sx={{
                  flex: 1,
                  py: 1.5,
                  px: 3,
                  backgroundColor: 'transparent',
                  color: 'rgba(74, 124, 140, 0.9)',
                  border: '1px solid rgba(74, 124, 140, 0.9)',
                  borderRadius: '8px',
                  fontFamily: 'Urbanist',
                  fontSize: '0.9rem',
                  textDecoration: 'none',
                  textAlign: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  '&:hover': {
                    backgroundColor: 'rgba(74, 124, 140, 0.1)',
                  },
                }}
              >
                Sign Up
              </Box>
            </Box>
          </Box>
        </Paper>
      </Box>
    );
  }

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <Box
        sx={{
          height: 'calc(100vh - 32px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '12px',
          maxWidth: 800,
          margin: '0 auto',
          backgroundColor: 'rgba(255, 255, 255, 0.25)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <CircularProgress size={32} sx={{ color: 'rgba(74, 124, 140, 0.9)' }} />
      </Box>
    );
  }

  return (
    <BackgroundImage imageUrl={bg?.url} lqip={bg?.lqip} attribution={{ authorName: bg?.authorName, authorUrl: bg?.authorUrl }} overlayOpacity={0}>
      <Box sx={{ position: 'relative' }}>
        <Box sx={{
          display: { xs: 'block', md: 'grid' },
          gridTemplateColumns: { md: selectedExperience ? 'minmax(0,1fr) 420px' : 'minmax(0,1fr) 0px' },
          gap: { md: 2 },
          alignItems: 'start',
          height: '100dvh'
        }}>
        {/* Left column: messages + input */}
        <Box sx={{ 
          display: 'grid',
          gridTemplateRows: '1fr auto',
          minWidth: 0,
          minHeight: 0,
          height: '100dvh',
          overflow: 'hidden',
          width: '100%',
          maxWidth: { md: selectedExperience ? '100%' : 760 },
          mx: 'auto',
          transition: `${isOpening ? '520ms' : '420ms'} cubic-bezier(.22,.61,.36,1)`,
          transitionProperty: 'max-width'
        }}>
          {/* Inline header row for chat list area */}
          {/* removed duplicate top Contact Support button; FAB remains */}
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
                <Button key={q} size="small" variant="outlined" onClick={() => { track('quick_reply_click', { query: q }); if (!loading) { sendMessage(q).catch(() => {}); } }} sx={{ textTransform: 'none' }}>
                  {q}
                </Button>
              ))}
            </Box>
          )}
          {currentChat?.messages?.map((message) => {
            // Parse AI messages for signup prompts
            const parsedResponse = !message.isUser ? parseAIResponse(message.content) : null;
            const displayContent = parsedResponse ? parsedResponse.content : message.content;
            const hasSignupPrompt = parsedResponse?.hasSignupPrompt;
            const signupUrl = parsedResponse?.signupUrl;

            // Fallback: extract URL directly if parsing fails
            const fallbackUrlMatch = !message.isUser ? message.content.match(/https:\/\/app\.experiahub\.com\/signup\?next=\/chat&sid[^\s"']+/) : null;
            const effectiveSignupUrl = signupUrl || (fallbackUrlMatch ? fallbackUrlMatch[0] : null);
            // Final UI-level fallback: extract from what we actually display
            const bubbleUrlMatch = !message.isUser ? displayContent.match(/https:\/\/app\.experiahub\.com\/signup\?next=\/chat&sid[^\s"']+/) : null;
            const finalSignupUrl = effectiveSignupUrl || (bubbleUrlMatch ? bubbleUrlMatch[0] : null);
            const showSignup = Boolean(finalSignupUrl);

            console.log('Message content:', message.content);
            console.log('Parsed response:', parsedResponse);
            console.log('Has signup prompt:', hasSignupPrompt, 'ShowSignup:', showSignup);
            console.log('Signup URL:', finalSignupUrl);

            // Prefer structured experiences; synthesize from text when missing
            const structuredList = (!message.isUser && Array.isArray((message as any).experiences)) ? (message as any).experiences : [];
            const synthesizedList = (!message.isUser && (!structuredList || structuredList.length === 0)) ? synthesizeExperiences(displayContent) : [];
            const experienceList: any[] = (Array.isArray(structuredList) && structuredList.length > 0) ? structuredList : synthesizedList;

            return (
            <Box
              key={message.id}
              sx={{
                display: 'flex',
                justifyContent: message.isUser ? 'flex-end' : 'flex-start',
                mb: 1
              }}
            >
                <Box sx={{ maxWidth: '80%', display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                      backgroundColor: message.isUser ? '#FFF3E5' : '#E9F0F3',
                      color: '#333333',
                  borderRadius: '16px',
                  ...(message.isUser ? {
                    borderBottomRightRadius: '4px',
                  } : {
                    borderBottomLeftRadius: '4px',
                  }),
                  fontFamily: 'Urbanist',
                      fontSize: '1rem',
                      lineHeight: 1.6,
                    }}
                  >
                    {(Array.isArray(experienceList) && experienceList.length > 0 && !message.isUser)
                      ? stripEnumerationsFromText(displayContent)
                      : displayContent}
                  </Paper>
                  {/* Structured/synthesized experiences list (top 5) */}
                  {!message.isUser && Array.isArray(experienceList) && experienceList.length > 0 && (
                    <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {experienceList.slice(0,5).map((exp: any, i: number) => (
                        <Paper key={i} elevation={0} sx={{ p: 1.5, backgroundColor: 'rgba(255,255,255,0.9)', border: '1px solid rgba(74,124,140,0.12)', borderRadius: '10px' }}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <Box sx={{ fontFamily: 'Urbanist', color: '#2F2F2F', fontSize: '0.95rem' }}>
                              {`${i+1}. ${exp?.title || 'Experience'}`}
                            </Box>
                            <Box sx={{ fontFamily: 'Urbanist', color: '#666', fontSize: '0.85rem' }}>
                              {[exp?.city, exp?.category, exp?.duration].filter(Boolean).join(' • ')}
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                              <Button size="small" variant="outlined" onClick={() => { track('details_click', { source: 'list', index: i+1, title: exp?.title, city: exp?.city, category: exp?.category }); setSelectedExperience(exp); }} sx={{ textTransform: 'none' }}>Details</Button>
                              {showWidgetCta && (
                                <Button
                                  size="small"
                                  variant="contained"
                                  onClick={() => {
                                    const pid = (exp as any)?.bokunProductId || (exp as any)?.productId || (exp as any)?.id;
                                    if (!pid) return;
                                    track('widget_open', { source: 'list', index: i + 1, title: exp?.title, city: exp?.city, category: exp?.category, productId: pid });
                                    setListWidgetProductId(String(pid));
                                    setListWidgetOpen(true);
                                  }}
                                  sx={{ textTransform: 'none', bgcolor: 'rgba(74, 124, 140, 0.9)' }}
                                >
                                  Check availability
                                </Button>
                              )}
                            </Box>
                          </Box>
                        </Paper>
                      ))}
                    </Box>
                  )}
                  {/* Optional inline details action only when there are experiences available */}
                  {!message.isUser && Array.isArray(experienceList) && experienceList.length > 0 && (
                    <Box>
                      <Button
                        size="small"
                        variant="text"
                        aria-controls="details-panel"
                        aria-expanded={Boolean(selectedExperience)}
                        onClick={() => { track('details_click', { source: 'inline', title: experienceList[0]?.title, city: experienceList[0]?.city, category: experienceList[0]?.category }); setSelectedExperience(experienceList[0]); }}
                      >
                        See details
                      </Button>
                    </Box>
                  )}
                  
                  {/* Signup Button for AI messages */}
                  {!message.isUser && (message as any).cta && (
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        backgroundColor: 'rgba(255, 183, 107, 0.1)',
                        border: '1px solid rgba(255, 183, 107, 0.3)',
                        borderRadius: '12px',
                        borderBottomLeftRadius: '4px',
                      }}
                    >
                      <Button
                        variant="contained"
                        href={(message as any).cta.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => track('cta_click', { label: (message as any).cta.label, url: (message as any).cta.url })}
                        sx={{
                          backgroundColor: 'rgba(255, 183, 107, 0.9)',
                          color: '#4A4A4A',
                          fontFamily: 'Urbanist',
                          fontSize: '0.85rem',
                          textTransform: 'none',
                          borderRadius: '8px',
                          px: 3,
                          py: 1,
                          '&:hover': {
                            backgroundColor: 'rgba(255, 183, 107, 1)',
                          },
                        }}
                      >
                        {(message as any).cta.label || 'Create Free Account'}
                      </Button>
                    </Paper>
                  )}

                  {/* Fallback button when no cta but URL is present */}
                  {!message.isUser && !((message as any).cta) && showSignup && (
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        backgroundColor: 'rgba(255, 183, 107, 0.1)',
                        border: '1px solid rgba(255, 183, 107, 0.3)',
                        borderRadius: '12px',
                        borderBottomLeftRadius: '4px',
                      }}
                    >
                      <Button
                        variant="contained"
                        href={finalSignupUrl as string}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => track('cta_click', { label: 'Create Free Account', url: finalSignupUrl })}
                        sx={{
                          backgroundColor: 'rgba(255, 183, 107, 0.9)',
                          color: '#4A4A4A',
                          fontFamily: 'Urbanist',
                          fontSize: '0.85rem',
                          textTransform: 'none',
                          borderRadius: '8px',
                          px: 3,
                          py: 1,
                          '&:hover': {
                            backgroundColor: 'rgba(255, 183, 107, 1)',
                          },
                        }}
                      >
                        Create Free Account
                      </Button>
                    </Paper>
                  )}
                </Box>
              </Box>
            );
          })}
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 1 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 1.5,
                  px: 2,
                  backgroundColor: '#E9F0F3',
                  color: '#333333',
                  borderRadius: '16px',
                  borderBottomLeftRadius: '4px',
                  fontFamily: 'Urbanist',
                  fontSize: '1rem',
                  lineHeight: 1.6,
                }}
              >
                <Box sx={{ display: 'inline-flex', gap: 0.6 }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#4a7c8c', animation: 'blink 1.2s infinite' }} />
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#4a7c8c', animation: 'blink 1.2s 0.2s infinite' }} />
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#4a7c8c', animation: 'blink 1.2s 0.4s infinite' }} />
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

        <Box sx={{ px: 1, pt: 1, pb: { xs: 'max(env(safe-area-inset-bottom, 0px), 30px)', md: '30px' }, background: 'transparent' }}>
          <TextField
            fullWidth
            placeholder="How can I help you today?"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={loading}
            sx={{
              '& .MuiOutlinedInput-root': {
                height: '44px',
                borderRadius: '22px',
                backgroundColor: 'rgba(255, 255, 255, 0.98)',
                backdropFilter: 'saturate(1) blur(0px)',
                '& fieldset': {
                  borderColor: 'rgba(74, 124, 140, 0.18)',
                  borderWidth: '1px !important',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(74, 124, 140, 0.28) !important',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'rgba(74, 124, 140, 0.36) !important',
                },
                '& input': {
                  padding: '10px 14px',
                  fontFamily: 'Urbanist',
                  fontSize: '1rem',
                  color: '#2F2F2F',
                },
              },
            }}
            InputProps={{
              endAdornment: (
                <IconButton
                  onClick={handleSend}
                  disabled={!input.trim()}
                  sx={{
                    mr: 0.5,
                    color: input.trim() ? 'rgba(74, 124, 140, 0.9)' : 'rgba(0, 0, 0, 0.3)',
                    '&:hover': {
                      backgroundColor: 'rgba(74, 124, 140, 0.1)',
                    },
                  }}
                >
                  <SendIcon />
                </IconButton>
              ),
            }}
          />
          </Box>
        </Box>

        {/* Right column details panel (visible >= md, animates in). Keep layout column always present but visually hidden to avoid left column warp. */}
        <Box
          sx={{
            display: { xs: 'none', md: 'block' },
            position: 'sticky',
            top: 0,
            height: '100dvh',
            overflowY: 'auto',
            overflow: 'hidden',
            width: { md: selectedExperience ? '420px' : 0 },
            minWidth: 0,
            transition: 'width 420ms cubic-bezier(.22,.61,.36,1), opacity 360ms ease-in-out, transform 360ms ease-in-out',
            opacity: selectedExperience ? 1 : 0,
            transform: selectedExperience ? 'translateY(0)' : 'translateY(8px)',
            transitionDelay: selectedExperience ? (isOpening ? '140ms' : '90ms') : '0ms',
            willChange: 'opacity, transform',
            pointerEvents: selectedExperience ? 'auto' : 'none',
            visibility: selectedExperience ? 'visible' : 'hidden'
          }}
        >
          <DetailsPanel exp={selectedExperience} onClose={handleCloseDetails} />
        </Box>
        </Box>
        <Dialog
          open={listWidgetOpen}
          onClose={() => setListWidgetOpen(false)}
          fullWidth
          maxWidth="md"
          aria-labelledby="booking-widget-title-list"
        >
          <DialogContent
            sx={{
              p: 0,
              paddingTop: 'max(16px, env(safe-area-inset-top))',
              paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
              paddingLeft: 'max(16px, env(safe-area-inset-left))',
              paddingRight: 'max(16px, env(safe-area-inset-right))'
            }}
          >
            {listWidgetProductId && (
              <BokunBookingWidget
                productId={listWidgetProductId}
                source="list"
                onError={(err) => console.error('Booking widget error:', err)}
              />
            )}
          </DialogContent>
        </Dialog>
        <SupportDialog open={supportOpen} onClose={()=>setSupportOpen(false)} defaultRole={'user'} />
        {/* Background picker opened via FAB to avoid header layout conflicts */}
        <Popover
          open={Boolean(bgAnchorEl)}
          anchorEl={bgAnchorEl}
          onClose={()=>setBgAnchorEl(null)}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
        <Paper
          sx={{ p: 2, width: 360, maxHeight: 420, overflowY: 'auto' }}
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
                onChange={(e)=>{
                  const v = e.target.value;
                  setBgSearch(v);
                  if (!v.trim()) { setBgResults([]); setBgPage(1); setBgSeed((s)=>s+1); }
                }}
                fullWidth
                InputProps={{
                  endAdornment: bgSearch ? (
                    <IconButton size="small" aria-label="Clear" onClick={()=>{ setBgSearch(''); setBgResults([]); setBgPage(1); setBgSeed((s)=>s+1); }}>
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  ) : null
                }}
              />
                <Button size="small" variant="outlined" disabled={bgLoading || !bgSearch.trim()} onClick={async ()=>{
                  try {
                    setBgLoading(true);
                    const results = await searchUnsplash(bgSearch.trim(), 1, 30);
                    setBgResults(Array.isArray(results)?results:[]);
                    setBgPage(1);
                  } finally { setBgLoading(false); }
                }}>Go</Button>
              </Stack>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
              {(!bgSearch.trim() && bgResults.length > 0 ? [] : curatedList).map((p, idx)=> (
                    <Box
                      key={`cur_${idx}`}
                      role="button"
                      tabIndex={0}
                      aria-label="Use curated background"
                      sx={{ cursor: 'pointer', borderRadius: 1, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.08)' }}
                      onKeyDown={async (e)=>{ if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); (e.currentTarget as any).click?.(); } }}
                      onClick={async ()=>{
                      const token = typeof window !== 'undefined' ? localStorage.getItem('wp_token') : null;
                      const next = { url: p.url, thumbUrl: p.thumbUrl } as PortalBackground;
                      setBg(next);
                      prefetchBackgroundImage(p.url);
                      saveCachedBackground(next, 'user');
                      try { await setUserBackground(token, next); } catch {}
                      try { trackBackgroundChange('chat', next); } catch {}
                      setBgAnchorEl(null);
                    }}
                    >
                  <img src={p.thumbUrl || p.url} alt="" loading="lazy" style={{ width: '100%', height: 72, objectFit: 'cover', display: 'block', background:'#e9eef2' }} />
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
                        aria-label={`Use image by ${authorName || 'author'}`}
                        sx={{ cursor: 'pointer', borderRadius: 1, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.08)' }}
                        onKeyDown={async (e)=>{ if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); (e.currentTarget as any).click?.(); } }}
                        onClick={async ()=>{
                        const token = typeof window !== 'undefined' ? localStorage.getItem('wp_token') : null;
                        const next = { id, url, thumbUrl: thumb, authorName, authorUrl } as PortalBackground;
                        setBg(next);
                        prefetchBackgroundImage(url);
                        saveCachedBackground(next, 'user');
                        try { await trackDownload(id); } catch (e) { console.warn('unsplash track failed', e); }
                        try { await setUserBackground(token, next); } catch {}
                        try { trackBackgroundChange('chat', next); } catch {}
                        setBgAnchorEl(null);
                      }}
                    >
                      <img src={thumb} alt={`Unsplash: ${p?.alt_description || authorName || 'photo'}`} style={{ width: '100%', height: 72, objectFit: 'cover', display: 'block' }} />
                    </Box>
                  );
                })
              }
            </Box>
            {(bgLoading || bgLoadingMore) && (<Skeleton variant="rectangular" height={60} />)}
            <Button size="small" color="error" variant="outlined" onClick={async ()=>{
              const token = typeof window !== 'undefined' ? localStorage.getItem('wp_token') : null;
              setBg(null); saveCachedBackground(null, 'user');
              try { await setUserBackground(token, null as any); } catch {}
              try { trackBackgroundRemove('chat'); } catch {}
              setBgAnchorEl(null);
            }}>Remove</Button>
          </Stack>
        </Paper>
      </Popover>
      <Fab
        color="primary"
        aria-label="Contact support"
        onClick={()=>setSupportOpen(true)}
        sx={{ position: 'fixed', right: 20, bottom: 24, zIndex: 2000, bgcolor: 'rgba(74,124,140,0.9)', '&:hover': { bgcolor: 'rgba(74,124,140,1)' } }}
      >
        <SupportAgentIcon />
      </Fab>
      {/* Background FAB (restored) */}
      <Fab
        color="default"
        aria-label="Background"
        onClick={(e)=>{ setBgSeed(Date.now()); setBgAnchorEl(e.currentTarget); }}
        sx={{ position: 'fixed', right: 20, bottom: 92, zIndex: 2000, bgcolor: 'rgba(255,255,255,0.9)', color: '#4a7c8c' }}
      >
        <WallpaperIcon />
      </Fab>
      </Box>
    </BackgroundImage>
  );
}