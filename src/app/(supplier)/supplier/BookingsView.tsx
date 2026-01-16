
import React, { useState, useMemo } from 'react';
import { 
  Box, Typography, Stack, Grid, Paper, Select, MenuItem, FormControl, InputLabel, 
  Table, TableBody, TableCell, TableHead, TableRow, Chip, IconButton, Button,
  Card, CardContent, ToggleButtonGroup, ToggleButton, Dialog, DialogTitle, DialogContent, DialogActions,
  LinearProgress, Avatar, TextField, TableSortLabel
} from '@mui/material';

import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import GroupIcon from '@mui/icons-material/Group';
import EventIcon from '@mui/icons-material/Event';
import CancelIcon from '@mui/icons-material/Cancel';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';

// Mock Data Types
interface Booking {
  id: string;
  customerName: string;
  experienceTitle: string;
  date: string;
  pax: number;
  price: number;
  currency: string;
  status: 'Confirmed' | 'Pending' | 'Cancelled' | 'Completed';
  avatar?: string;
  avatarUrl?: string;
}

const MOCK_BOOKINGS: Booking[] = [
  { id: 'BK-1001', customerName: 'Alice Smith', experienceTitle: 'Kyoto Tea Ceremony', date: '2026-02-15', pax: 2, price: 15000, currency: 'JPY', status: 'Confirmed', avatar: 'AS', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80' },
  { id: 'BK-1002', customerName: 'Bob Jones', experienceTitle: 'Samurai Experience', date: '2026-02-18', pax: 4, price: 40000, currency: 'JPY', status: 'Confirmed', avatar: 'BJ', avatarUrl: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=150&q=80' },
  { id: 'BK-1003', customerName: 'Charlie Brown', experienceTitle: 'Kyoto Tea Ceremony', date: '2026-03-01', pax: 1, price: 7500, currency: 'JPY', status: 'Pending', avatar: 'CB', avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80' },
  { id: 'BK-1004', customerName: 'Diana Prince', experienceTitle: 'Hidden Shrine Walk', date: '2026-03-10', pax: 3, price: 12000, currency: 'JPY', status: 'Cancelled', avatar: 'DP' },
  { id: 'BK-1005', customerName: 'Evan Wright', experienceTitle: 'Samurai Experience', date: '2026-04-05', pax: 2, price: 20000, currency: 'JPY', status: 'Confirmed', avatar: 'EW' },
  { id: 'BK-1006', customerName: 'Fiona Green', experienceTitle: 'Geisha District Tour', date: '2026-04-12', pax: 2, price: 18000, currency: 'JPY', status: 'Pending', avatar: 'FG', avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80' },
  { id: 'BK-1007', customerName: 'George Hill', experienceTitle: 'Kyoto Tea Ceremony', date: '2026-05-01', pax: 6, price: 45000, currency: 'JPY', status: 'Confirmed', avatar: 'GH' },
  { id: 'BK-1008', customerName: 'Hannah Lee', experienceTitle: 'Bamboo Forest Walk', date: '2026-05-20', pax: 2, price: 10000, currency: 'JPY', status: 'Confirmed', avatar: 'HL', avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80' },
];

const RECENT_ACTIVITY = [
    { text: 'New booking from Alice Smith', time: '2 hours ago', type: 'booking' },
    { text: 'Payment received for BK-1002', time: '5 hours ago', type: 'payment' },
    { text: 'Booking BK-1004 cancelled by user', time: '1 day ago', type: 'cancel' },
    { text: 'New 5-star review for Samurai Experience', time: '2 days ago', type: 'review' },
];

export default function BookingsView() {
  const [timeRange, setTimeRange] = useState<number>(6); // Default 6 Months
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [bookings, setBookings] = useState<Booking[]>(MOCK_BOOKINGS);
  const [selectedEvent, setSelectedEvent] = useState<Booking | null>(null);
  const [isAddBookingOpen, setIsAddBookingOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [orderBy, setOrderBy] = useState<keyof Booking>('date');

  // Computed KPIs based on filtered bookings
  const filteredBookings = bookings.filter(b => {
    // For Calendar, might want fewer filters, but for KPI alignment, stick to timeRange
    return true; 
  });

  // KPI calculations restricted to range
  const kpiBookings = bookings.filter(b => {
      const d = new Date(b.date);
      const now = new Date();
      const cutoff = new Date();
      cutoff.setMonth(now.getMonth() + timeRange);
      // Simple range check
      return d >= now && d <= cutoff;
  });

  const totalRevenue = kpiBookings.filter(b => b.status !== 'Cancelled').reduce((acc, b) => acc + b.price, 0);
  const totalPax = kpiBookings.filter(b => b.status !== 'Cancelled').reduce((acc, b) => acc + b.pax, 0);
  const totalCount = kpiBookings.filter(b => b.status !== 'Cancelled').length;

  const handleRequestSort = (property: keyof Booking) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortedBookings = useMemo(() => {
    return [...kpiBookings].sort((a, b) => {
        let valA = a[orderBy];
        let valB = b[orderBy];

        if (typeof valA === 'number' && typeof valB === 'number') {
             return order === 'asc' ? valA - valB : valB - valA;
        }
        
        if (orderBy === 'date') {
             return order === 'asc' 
                ? new Date(a.date).getTime() - new Date(b.date).getTime()
                : new Date(b.date).getTime() - new Date(a.date).getTime();
        }

        const strA = String(valA || '').toLowerCase();
        const strB = String(valB || '').toLowerCase();
        if (strA < strB) return order === 'asc' ? -1 : 1;
        if (strA > strB) return order === 'asc' ? 1 : -1;
        return 0;
    });
  }, [kpiBookings, order, orderBy]);

  const calendarEvents = bookings.map(b => ({
      id: b.id,
      title: `${b.customerName} (${b.pax})`,
      date: b.date,
      backgroundColor: b.status === 'Confirmed' ? '#10B981' : b.status === 'Cancelled' ? '#EF4444' : '#F59E0B',
      borderColor: 'transparent',
      extendedProps: { ...b }
  }));

  const handleOpenAdd = () => {
      setEditingBooking(null);
      setIsAddBookingOpen(true);
  };

  const handleOpenEdit = (booking: Booking) => {
      setEditingBooking(booking);
      setIsAddBookingOpen(true);
      setSelectedEvent(null); // Close details if open
  };

  return (
    <Box sx={{ p: 4, bgcolor: 'transparent', minHeight: '80vh' }}>
      
      {/* Header & Filter */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontFamily: 'Agrandir, serif', fontWeight: 600, color: '#010057' }}>
          Bookings Dashboard
        </Typography>
        
        <Stack direction="row" spacing={2}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
            <Select 
                value={timeRange} 
                onChange={(e) => setTimeRange(Number(e.target.value))}
                sx={{ bgcolor: 'white', borderRadius: 1, fontFamily: 'Nunito, sans-serif' }}
            >
                <MenuItem value={1}>Next 1 Month</MenuItem>
                <MenuItem value={3}>Next 3 Months</MenuItem>
                <MenuItem value={6}>Next 6 Months</MenuItem>
                <MenuItem value={12}>Next 12 Months</MenuItem>
            </Select>
            </FormControl>

            <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(e, v) => v && setViewMode(v)}
                size="small"
                sx={{ bgcolor:'white', borderRadius:1 }}
            >
                <ToggleButton value="list" sx={{ width: 60 }}><FormatListBulletedIcon /></ToggleButton>
                <ToggleButton value="calendar" sx={{ width: 60 }}><CalendarMonthIcon /></ToggleButton>
            </ToggleButtonGroup>
        </Stack>
      </Stack>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, bgcolor: 'white', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ p: 1.5, borderRadius: '50%', bgcolor: '#EFF6FF', color: '#010057' }}><EventIcon /></Box>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Nunito, sans-serif', fontWeight: 600 }}>Active Bookings</Typography>
              <Typography variant="h5" sx={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, color: '#0F172A' }}>{totalCount}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'Nunito, sans-serif' }}>Next {timeRange} months</Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, bgcolor: 'white', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ p: 1.5, borderRadius: '50%', bgcolor: '#F0FDF4', color: '#10B981' }}><AttachMoneyIcon /></Box>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Nunito, sans-serif', fontWeight: 600 }}>Projected Revenue</Typography>
              <Typography variant="h5" sx={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, color: '#0F172A' }}>
                ¥{totalRevenue.toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'Nunito, sans-serif' }}>Next {timeRange} months</Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, bgcolor: 'white', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ p: 1.5, borderRadius: '50%', bgcolor: '#FFF7ED', color: '#F97316' }}><GroupIcon /></Box>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Nunito, sans-serif', fontWeight: 600 }}>Passengers (Pax)</Typography>
              <Typography variant="h5" sx={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, color: '#0F172A' }}>{totalPax}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'Nunito, sans-serif' }}>Next {timeRange} months</Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
          {/* Main Content (Table / Calendar) */}
          <Grid item xs={12} lg={8}>
            <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #E2E8F0', overflow: 'hidden', minHeight: 400, bgcolor:'white', p: viewMode==='calendar'?2:0 }}>
                {viewMode === 'list' ? (
                <Box sx={{ overflowX: 'auto', width: '100%' }}>
                <Table sx={{ minWidth: 950 }}>
                <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                    <TableRow>
                    <TableCell sortDirection={orderBy === 'id' ? order : false}>
                        <TableSortLabel active={orderBy === 'id'} direction={orderBy === 'id' ? order : 'asc'} onClick={() => handleRequestSort('id')} sx={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700, color: '#64748B !important' }}>
                        Booking ID
                        </TableSortLabel>
                    </TableCell>
                    <TableCell>
                         <TableSortLabel active={orderBy === 'experienceTitle'} direction={orderBy === 'experienceTitle' ? order : 'asc'} onClick={() => handleRequestSort('experienceTitle')} sx={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700, color: '#64748B !important' }}>
                         Experience
                         </TableSortLabel>
                    </TableCell>
                    <TableCell>
                         <TableSortLabel active={orderBy === 'customerName'} direction={orderBy === 'customerName' ? order : 'asc'} onClick={() => handleRequestSort('customerName')} sx={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700, color: '#64748B !important' }}>
                         Customer
                         </TableSortLabel>
                    </TableCell>
                    <TableCell>
                         <TableSortLabel active={orderBy === 'date'} direction={orderBy === 'date' ? order : 'asc'} onClick={() => handleRequestSort('date')} sx={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700, color: '#64748B !important' }}>
                         Date
                         </TableSortLabel>
                    </TableCell>
                    <TableCell>
                         <TableSortLabel active={orderBy === 'pax'} direction={orderBy === 'pax' ? order : 'asc'} onClick={() => handleRequestSort('pax')} sx={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700, color: '#64748B !important' }}>
                         Pax
                         </TableSortLabel>
                    </TableCell>
                    <TableCell>
                         <TableSortLabel active={orderBy === 'price'} direction={orderBy === 'price' ? order : 'asc'} onClick={() => handleRequestSort('price')} sx={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700, color: '#64748B !important' }}>
                         Price
                         </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700, color: '#64748B' }}>Status</TableCell>
                    <TableCell sx={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700, color: '#64748B', textAlign:'right' }}>Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {sortedBookings.length > 0 ? sortedBookings.map((b) => (
                    <TableRow key={b.id} hover onClick={() => setSelectedEvent(b)} sx={{ cursor: 'pointer' }}>
                        <TableCell sx={{ fontFamily: 'Nunito, sans-serif', fontWeight: 600, color: '#010057' }}>{b.id}</TableCell>
                        <TableCell sx={{ fontFamily: 'Nunito, sans-serif' }}>{b.experienceTitle}</TableCell>
                        <TableCell sx={{ fontFamily: 'Nunito, sans-serif' }}>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <Avatar src={b.avatarUrl} sx={{ width: 24, height: 24, fontSize: '0.75rem', bgcolor: '#E2E8F0', color: '#64748B' }}>{b.avatar}</Avatar>
                                <Typography variant="body2" sx={{ fontFamily:'Nunito, sans-serif' }}>{b.customerName}</Typography>
                            </Stack>
                        </TableCell>
                        <TableCell sx={{ fontFamily: 'Nunito, sans-serif' }}>{new Date(b.date).toLocaleDateString()}</TableCell>
                        <TableCell sx={{ fontFamily: 'Nunito, sans-serif' }}>{b.pax}</TableCell>
                        <TableCell sx={{ fontFamily: 'Nunito, sans-serif' }}>{b.currency} {b.price.toLocaleString()}</TableCell>
                        <TableCell>
                        <Chip 
                            label={b.status} 
                            size="small"
                            sx={{ 
                            fontFamily: 'Nunito, sans-serif', fontWeight: 700,
                            bgcolor: b.status === 'Confirmed' ? '#F0FDF4' : b.status === 'Cancelled' ? '#FEF2F2' : '#FFF7ED',
                            color: b.status === 'Confirmed' ? '#166534' : b.status === 'Cancelled' ? '#991B1B' : '#C2410C'
                            }} 
                        />
                        </TableCell>
                        <TableCell align="right">
                           <Button 
                                size="small"
                                sx={{ color: '#64748B', minWidth: 0, p: 1 }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenEdit(b);
                                }}
                            >
                                Edit
                            </Button>
                        </TableCell>
                    </TableRow>
                    )) : (
                    <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 4, color: '#94A3B8', fontFamily: 'Nunito, sans-serif' }}>No bookings found for this period.</TableCell>
                    </TableRow>
                    )}
                </TableBody>
                </Table>
                </Box>
                ) : (
                    <Box sx={{ fontFamily: 'Nunito, sans-serif' }}>
                        <style dangerouslySetInnerHTML={{__html: `
                            .fc-toolbar-title { font-family: 'Agrandir', serif !important; color: #010057; }
                            .fc-button-primary { background-color: #010057 !important; border-color: #010057 !important; }
                            .fc-button-active { background-color: #C5A059 !important; border-color: #C5A059 !important; }
                            .fc-daygrid-day-number { font-family: 'Nunito', sans-serif; color: #334155; }
                            .fc-col-header-cell-cushion { font-family: 'Nunito', sans-serif; color: #64748B; font-weight: 700; }
                        `}} />
                        <FullCalendar
                            plugins={[dayGridPlugin, listPlugin, interactionPlugin]}
                            initialView="dayGridMonth"
                            headerToolbar={{
                                left: 'prev,next today',
                                center: 'title',
                                right: 'dayGridMonth,listWeek'
                            }}
                            events={calendarEvents}
                            eventClick={(info) => {
                                const b = info.event.extendedProps as Booking;
                                setSelectedEvent(b);
                            }}
                            height="auto"
                        />
                    </Box>
                )}
            </Paper>
          </Grid>
          
          {/* Side Panel: Activity & Revenue */}
          <Grid item xs={12} lg={4}>
             <Stack spacing={3}>
                 {/* Quick Actions */}
                 <Paper elevation={0} sx={{ p: 3, borderRadius: 3, bgcolor: 'white', border: '1px solid #E2E8F0' }}>
                     <Typography variant="h6" sx={{ fontFamily: 'Agrandir, serif', fontWeight: 600, color: '#010057', mb: 2 }}>Quick Actions</Typography>
                     <Stack spacing={2}>
                         <Button variant="outlined" startIcon={<EventIcon />} onClick={handleOpenAdd} sx={{ justifyContent: 'flex-start', fontFamily: 'Nunito, sans-serif', borderColor: '#E2E8F0', color: '#334155', textTransform: 'none', '&:hover': { borderColor: '#010057', bgcolor: '#F1F5F9' } }}>
                             Manually Add Booking
                         </Button>
                         <Button variant="outlined" startIcon={<CalendarMonthIcon />} sx={{ justifyContent: 'flex-start', fontFamily: 'Nunito, sans-serif', borderColor: '#E2E8F0', color: '#334155', textTransform: 'none', '&:hover': { borderColor: '#010057', bgcolor: '#F1F5F9' } }}>
                             Block Dates
                         </Button>
                     </Stack>
                 </Paper>

                 {/* Revenue Trend Placeholder */}
                 <Paper elevation={0} sx={{ p: 3, borderRadius: 3, bgcolor: 'white', border: '1px solid #E2E8F0' }}>
                     <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                         <TrendingUpIcon sx={{ color: '#010057' }} />
                         <Typography variant="h6" sx={{ fontFamily: 'Agrandir, serif', fontWeight: 600, color: '#010057' }}>Monthly Revenue</Typography>
                     </Stack>
                     <Box sx={{ height: 100, display: 'flex', alignItems: 'flex-end', gap: 1 }}>
                         {[40, 65, 30, 80, 55, 90].map((h, i) => (
                             <Box key={i} sx={{ flex: 1, bgcolor: i===5 ? '#010057' : '#E2E8F0', height: `${h}%`, borderRadius: '4px 4px 0 0', transition: 'all .3s' }} />
                         ))}
                     </Box>
                     <Typography variant="caption" sx={{ display:'block', mt:1, textAlign:'center', color:'#64748B', fontFamily:'Nunito, sans-serif' }}>Last 6 months performance</Typography>
                 </Paper>

                 {/* Recent Activity */}
                 <Paper elevation={0} sx={{ p: 3, borderRadius: 3, bgcolor: 'white', border: '1px solid #E2E8F0' }}>
                    <Typography variant="h6" sx={{ fontFamily: 'Agrandir, serif', fontWeight: 600, color: '#010057', mb: 2 }}>Recent Activity</Typography>
                    <Stack spacing={2}>
                        {RECENT_ACTIVITY.map((act, i) => (
                            <Box key={i} sx={{ display:'flex', gap: 2 }}>
                                <Box sx={{ 
                                    width: 8, height: 8, borderRadius: '50%', mt: 0.8,
                                    bgcolor: act.type === 'booking' ? '#10B981' : act.type === 'cancel' ? '#EF4444' : '#3B82F6' 
                                }} />
                                <Box>
                                    <Typography variant="body2" sx={{ fontFamily: 'Nunito, sans-serif', fontWeight: 600, color: '#334155' }}>{act.text}</Typography>
                                    <Typography variant="caption" sx={{ fontFamily: 'Nunito, sans-serif', color: '#94A3B8' }}>{act.time}</Typography>
                                </Box>
                            </Box>
                        ))}
                    </Stack>
                 </Paper>
             </Stack>
          </Grid>
      </Grid>

      {/* Details Dialog */}
      <Dialog open={!!selectedEvent} onClose={()=>setSelectedEvent(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontFamily: 'Agrandir, serif', borderBottom: '1px solid #eee' }}>Booking Details</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
            {selectedEvent && (
                <Stack spacing={2} sx={{ mt: 2 }}>
                    <Stack direction="row" justifyContent="flex-start" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                        <Avatar src={selectedEvent.avatarUrl} sx={{ width: 64, height: 64, bgcolor: '#010057', fontSize: '1.5rem' }}>{selectedEvent.avatar}</Avatar>
                        <Box>
                            <Typography variant="h6" sx={{ fontFamily: 'Agrandir, serif', fontWeight: 600 }}>{selectedEvent.customerName}</Typography>
                             <Chip label={selectedEvent.status} size="small" color={selectedEvent.status==='Confirmed'?'success':selectedEvent.status==='Cancelled'?'error':'warning'} />
                        </Box>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                        <Typography color="text.secondary">Booking ID:</Typography>
                        <Typography fontWeight={700}>{selectedEvent.id}</Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                        <Typography color="text.secondary">Experience:</Typography>
                        <Typography fontWeight={700}>{selectedEvent.experienceTitle}</Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                        <Typography color="text.secondary">Date:</Typography>
                        <Typography fontWeight={700}>{new Date(selectedEvent.date).toLocaleDateString()}</Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                        <Typography color="text.secondary">Pax:</Typography>
                        <Typography fontWeight={700}>{selectedEvent.pax} people</Typography>
                    </Stack>
                     <Stack direction="row" justifyContent="space-between">
                        <Typography color="text.secondary">Total Price:</Typography>
                        <Typography fontWeight={700}>{selectedEvent.currency} {selectedEvent.price.toLocaleString()}</Typography>
                    </Stack>
                </Stack>
            )}
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid #eee', p: 2 }}>
             <Button onClick={()=>setSelectedEvent(null)} sx={{ color: '#64748B' }}>Close</Button>
             
             {selectedEvent?.status !== 'Cancelled' && (
                 <>
                     <Button 
                        variant="outlined"
                        onClick={() => selectedEvent && handleOpenEdit(selectedEvent)}
                        sx={{ color: '#010057', borderColor: '#010057' }}
                     >
                         Edit Booking
                     </Button>
                     <Button color="error" variant="outlined" onClick={() => {
                         if(window.confirm('Cancel booking?')){
                             setBookings(prev => prev.map(x => x.id === selectedEvent!.id ? { ...x, status: 'Cancelled' } : x));
                             setSelectedEvent(null);
                         }
                     }}>Cancel Booking</Button>
                 </>
             )}
        </DialogActions>
      </Dialog>

      {/* Add/Edit Booking Modal */}
      <Dialog open={isAddBookingOpen} onClose={() => setIsAddBookingOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontFamily: 'Agrandir, serif', color: '#010057' }}>{editingBooking ? 'Edit Booking' : 'Add Manual Booking'}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
            <Stack spacing={3} sx={{ mt: 1 }}>
                <FormControl fullWidth size="small">
                    <InputLabel>Experience</InputLabel>
                    <Select label="Experience" defaultValue={editingBooking?.experienceTitle || "Kyoto Tea Ceremony"}>
                        <MenuItem value="Kyoto Tea Ceremony">Kyoto Tea Ceremony</MenuItem>
                        <MenuItem value="Samurai Experience">Samurai Experience</MenuItem>
                        <MenuItem value="Bamboo Forest Walk">Bamboo Forest Walk</MenuItem>
                    </Select>
                </FormControl>
                <TextField label="Customer Name" fullWidth size="small" defaultValue={editingBooking?.customerName || ''} />
                <TextField label="Date" type="date" fullWidth size="small" InputLabelProps={{ shrink: true }} defaultValue={editingBooking?.date ? editingBooking.date.split('T')[0] : ''} />
                <Stack direction="row" spacing={2}>
                    <TextField label="Pax" type="number" fullWidth size="small" defaultValue={editingBooking?.pax || ''} />
                    <TextField label="Price (JPY)" type="number" fullWidth size="small" defaultValue={editingBooking?.price || ''} />
                </Stack>
            </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #eee' }}>
            <Button onClick={() => setIsAddBookingOpen(false)} sx={{ color: '#64748B' }}>Cancel</Button>
            <Button variant="contained" onClick={() => {
                if (editingBooking) {
                     // Update existing
                     setBookings(prev => prev.map(b => b.id === editingBooking.id ? { 
                         ...b, 
                         customerName: 'Updated Customer', // In real app, bind to state
                         pax: 2 // Mock update
                     } : b));
                } else {
                    // Create new
                    const newB: Booking = {
                        id: `BK-${1000 + bookings.length + 1}`,
                        customerName: 'New Customer',
                        experienceTitle: 'Manual Booking',
                        date: new Date().toISOString(),
                        pax: 2, price: 10000, currency: 'JPY', status: 'Confirmed', avatar: 'NC'
                    };
                    setBookings([...bookings, newB]);
                }
                setIsAddBookingOpen(false);
            }} sx={{ bgcolor: '#010057', fontFamily: 'Nunito, sans-serif' }}>
                {editingBooking ? 'Save Changes' : 'Create Booking'}
            </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
