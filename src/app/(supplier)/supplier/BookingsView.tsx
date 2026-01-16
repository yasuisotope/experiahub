
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Box, Typography, Stack, Grid, Paper, Select, MenuItem, FormControl, InputLabel, 
  Table, TableBody, TableCell, TableHead, TableRow, Chip, IconButton, Button,
  Card, CardContent, ToggleButtonGroup, ToggleButton, Dialog, DialogTitle, DialogContent, DialogActions,
  LinearProgress, Avatar, TextField, TableSortLabel, Checkbox, FormControlLabel, TableContainer, TablePagination
} from '@mui/material';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

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
  const [filterType, setFilterType] = useState<string>('future_6');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchText, setSearchText] = useState('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBookings() {
        setLoading(true);
        const params = new URLSearchParams(window.location.search);
        const appId = params.get('applicationId') || 'SUP-543C66BA';

        const { data, error } = await supabase
            .from('bookings')
            .select('*')
            .eq('application_id', appId)
            .order('date', { ascending: false });

        if (error) {
            console.error('Error fetching bookings:', error);
        } else if (data) {
            const mapped: Booking[] = data.map((row: any) => ({
                id: row.id,
                experienceTitle: row.experience_title || 'Unknown',
                customerName: row.customer_name || 'Unknown',
                date: row.date,
                pax: row.pax || 0,
                price: row.price || 0,
                status: row.status as any,
                amount: row.price,
                currency: row.currency || 'USD',
                avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(row.customer_name)}&background=random`
            }));
            setBookings(mapped);
        }
        setLoading(false);
    }
    fetchBookings();
  }, []);
  const [selectedEvent, setSelectedEvent] = useState<Booking | null>(null);
  const [isAddBookingOpen, setIsAddBookingOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [formState, setFormState] = useState({
      experienceTitle: '',
      customerName: '',
      date: '',
      pax: 1,
      price: 0,
      status: 'Confirmed'
  });

  useEffect(() => {
    if (isAddBookingOpen) {
        if (editingBooking) {
             let d = '';
             try { d = new Date(editingBooking.date).toISOString().split('T')[0]; } catch(e){}
             setFormState({
                 experienceTitle: editingBooking.experienceTitle,
                 customerName: editingBooking.customerName,
                 date: d,
                 pax: editingBooking.pax,
                 price: editingBooking.price,
                 status: editingBooking.status
             });
        } else {
             const d = new Date().toISOString().split('T')[0];
             setFormState({
                 experienceTitle: 'Authentic Echoes',
                 customerName: '',
                 date: d,
                 pax: 2,
                 price: 150,
                 status: 'Confirmed'
             });
        }
    }
  }, [isAddBookingOpen, editingBooking]);

  const handleSaveBooking = async () => {
    const payload = {
        application_id: 'SUP-543C66BA',
        experience_title: formState.experienceTitle,
        customer_name: formState.customerName,
        date: new Date(formState.date).toISOString(),
        pax: Number(formState.pax),
        price: Number(formState.price),
        status: formState.status
    };

    if (editingBooking) {
        const { error } = await supabase.from('bookings').update(payload).eq('id', editingBooking.id);
        if (error) alert('Error updating: ' + error.message);
    } else {
        const { error } = await supabase.from('bookings').insert(payload);
        if (error) alert('Error creating: ' + error.message);
    }
    window.location.reload();
  };
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
      now.setHours(0,0,0,0);
      
      switch (filterType) {
          case 'all': return true;
          case 'past_all': return d < now;
          case 'past_1': {
              const start = new Date(now); start.setMonth(now.getMonth() - 1);
              return d < now && d >= start;
          }
          case 'past_2': {
              const start = new Date(now); start.setMonth(now.getMonth() - 2);
              return d < now && d >= start;
          }
          case 'past_6': {
              const start = new Date(now); start.setMonth(now.getMonth() - 6);
              return d < now && d >= start;
          }
          case 'future_all': return d >= now;
          case 'future_1': {
              const end = new Date(now); end.setMonth(now.getMonth() + 1);
              return d >= now && d <= end;
          }
          case 'future_2': {
              const end = new Date(now); end.setMonth(now.getMonth() + 2);
              return d >= now && d <= end;
          }
          case 'future_6': {
              const end = new Date(now); end.setMonth(now.getMonth() + 6);
              return d >= now && d <= end;
          }
          default: return true;
      }
  });

  const totalRevenue = kpiBookings.filter(b => b.status !== 'Cancelled').reduce((acc, b) => acc + b.price, 0);
  const totalPax = kpiBookings.filter(b => b.status !== 'Cancelled').reduce((acc, b) => acc + b.pax, 0);
  const totalCount = kpiBookings.filter(b => b.status !== 'Cancelled').length;

  let filterLabel = "All bookings";
  if (filterType === 'past_all') filterLabel = "Past bookings";
  else if (filterType === 'past_1') filterLabel = "Past 1 month";
  else if (filterType === 'past_2') filterLabel = "Past 2 months";
  else if (filterType === 'past_6') filterLabel = "Past 6 months";
  else if (filterType === 'future_all') filterLabel = "All Future bookings";
  else if (filterType === 'future_1') filterLabel = "Next 1 month";
  else if (filterType === 'future_2') filterLabel = "Next 2 months";
  else if (filterType === 'future_6') filterLabel = "Next 6 months";

  const handleRequestSort = (property: keyof Booking) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortedBookings = useMemo(() => {
    // 1. Text Search Filter
    let result = kpiBookings;
    if (searchText) {
        const q = searchText.toLowerCase();
        result = result.filter(b => 
            b.customerName.toLowerCase().includes(q) || 
            b.experienceTitle.toLowerCase().includes(q) ||
            b.id.toLowerCase().includes(q) ||
            String(b.pax).includes(q)
        );
    }

    return [...result].sort((a, b) => {
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
  }, [kpiBookings, order, orderBy, searchText]);

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
        
        {/* Controls moved to Toolbar */}
      </Stack>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, bgcolor: 'white', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ p: 1.5, borderRadius: '50%', bgcolor: '#EFF6FF', color: '#010057' }}><EventIcon /></Box>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Nunito, sans-serif', fontWeight: 600 }}>Active Bookings</Typography>
              <Typography variant="h5" sx={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, color: '#0F172A' }}>{totalCount}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'Nunito, sans-serif' }}>{filterLabel}</Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, bgcolor: 'white', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ p: 1.5, borderRadius: '50%', bgcolor: '#F0FDF4', color: '#10B981' }}><AttachMoneyIcon /></Box>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Nunito, sans-serif', fontWeight: 600 }}>Projected Revenue</Typography>
              <Typography variant="h5" sx={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, color: '#0F172A' }}>
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalRevenue)}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'Nunito, sans-serif' }}>{filterLabel}</Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, bgcolor: 'white', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ p: 1.5, borderRadius: '50%', bgcolor: '#FFF7ED', color: '#F97316' }}><GroupIcon /></Box>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Nunito, sans-serif', fontWeight: 600 }}>Passengers (Pax)</Typography>
              <Typography variant="h5" sx={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, color: '#0F172A' }}>{totalPax}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'Nunito, sans-serif' }}>{filterLabel}</Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
          {/* Main Content (Table / Calendar) */}
          <Grid item xs={12} lg={8}>
            <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #E2E8F0', overflow: 'hidden', minHeight: 400, bgcolor:'white', p: 0 }}>
                
                {/* Internal Toolbar */}
                <Stack direction="row" spacing={2} alignItems="center" sx={{ p: 2, borderBottom: '1px solid #E2E8F0', bgcolor: '#F8FAFC' }}>
                     <TextField 
                        placeholder="Search..." 
                        size="small" 
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        sx={{ bgcolor: 'white', borderRadius: 1, flexGrow: 1 }}
                    />
                     
                     <FormControl size="small" sx={{ minWidth: 180 }}>
                        <Select 
                            value={filterType} 
                            onChange={(e) => setFilterType(e.target.value)}
                            sx={{ bgcolor: 'white', borderRadius: 1, fontFamily: 'Nunito, sans-serif' }}
                        >
                            <MenuItem value="all">All bookings</MenuItem>
                            <MenuItem value="past_all">All Past</MenuItem>
                            <MenuItem value="past_1">Past 1 month</MenuItem>
                            <MenuItem value="past_2">Past 2 months</MenuItem>
                            <MenuItem value="past_6">Past 6 months</MenuItem>
                            <MenuItem value="future_all">All Future</MenuItem>
                            <MenuItem value="future_1">Next 1 month</MenuItem>
                            <MenuItem value="future_2">Next 2 months</MenuItem>
                            <MenuItem value="future_6">Next 6 months</MenuItem>
                        </Select>
                    </FormControl>

                     <ToggleButtonGroup
                        value={viewMode}
                        exclusive
                        onChange={(e, v) => v && setViewMode(v)}
                        size="small"
                        sx={{ bgcolor:'white', borderRadius:1 }}
                    >
                        <ToggleButton value="list"><FormatListBulletedIcon /></ToggleButton>
                        <ToggleButton value="calendar"><CalendarMonthIcon /></ToggleButton>
                    </ToggleButtonGroup>
                </Stack>

                {viewMode === 'list' ? (
                <>
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
                    {sortedBookings.length > 0 ? sortedBookings
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((b) => (
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
                        <TableCell sx={{ fontFamily: 'Nunito, sans-serif' }}>
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(b.price)}
                        </TableCell>
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
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={sortedBookings.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={(e, p) => setPage(p)}
                    onRowsPerPageChange={(e) => {
                        setRowsPerPage(parseInt(e.target.value, 10));
                        setPage(0);
                    }}
                />
                </>
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
                    <Select 
                        label="Experience" 
                        value={formState.experienceTitle}
                        onChange={(e) => setFormState({...formState, experienceTitle: e.target.value})}
                    >
                        <MenuItem value="Authentic Echoes">Authentic Echoes</MenuItem>
                        <MenuItem value="Hidden Gems of Kyoto">Hidden Gems of Kyoto</MenuItem>
                        <MenuItem value="Zen Gardens Tour">Zen Gardens Tour</MenuItem> 
                         {/* Fallback for existing data */}
                         {!['Authentic Echoes','Hidden Gems of Kyoto','Zen Gardens Tour'].includes(formState.experienceTitle) && formState.experienceTitle &&
                            <MenuItem value={formState.experienceTitle}>{formState.experienceTitle}</MenuItem>
                         }
                    </Select>
                </FormControl>
                <TextField 
                    label="Customer Name" fullWidth size="small" 
                    value={formState.customerName}
                    onChange={(e) => setFormState({...formState, customerName: e.target.value})}
                />
                <TextField 
                    label="Date" type="date" fullWidth size="small" InputLabelProps={{ shrink: true }} 
                    value={formState.date}
                    onChange={(e) => setFormState({...formState, date: e.target.value})}
                />
                <Stack direction="row" spacing={2}>
                    <TextField 
                        label="Pax" type="number" fullWidth size="small" 
                        value={formState.pax}
                        onChange={(e) => setFormState({...formState, pax: Number(e.target.value)})}
                    />
                    <TextField 
                        label="Price (USD)" type="number" fullWidth size="small" 
                        value={formState.price}
                        onChange={(e) => setFormState({...formState, price: Number(e.target.value)})}
                    />
                </Stack>
            </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #eee' }}>
            <Button onClick={() => setIsAddBookingOpen(false)} sx={{ color: '#64748B' }}>Cancel</Button>
            <Button variant="contained" onClick={handleSaveBooking} sx={{ bgcolor: '#010057', fontFamily: 'Nunito, sans-serif' }}>
                {editingBooking ? 'Save Changes' : 'Create Booking'}
            </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
