
import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Stack, Grid, Paper, Select, MenuItem, FormControl, InputLabel, 
  Table, TableBody, TableCell, TableHead, TableRow, Chip, IconButton, Button,
  Card, CardContent
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import GroupIcon from '@mui/icons-material/Group';
import EventIcon from '@mui/icons-material/Event';
import CancelIcon from '@mui/icons-material/Cancel';

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
}

const MOCK_BOOKINGS: Booking[] = [
  { id: 'BK-1001', customerName: 'Alice Smith', experienceTitle: 'Kyoto Tea Ceremony', date: '2026-02-15', pax: 2, price: 15000, currency: 'JPY', status: 'Confirmed' },
  { id: 'BK-1002', customerName: 'Bob Jones', experienceTitle: 'Samurai Experience', date: '2026-02-18', pax: 4, price: 40000, currency: 'JPY', status: 'Confirmed' },
  { id: 'BK-1003', customerName: 'Charlie Brown', experienceTitle: 'Kyoto Tea Ceremony', date: '2026-03-01', pax: 1, price: 7500, currency: 'JPY', status: 'Pending' },
  { id: 'BK-1004', customerName: 'Diana Prince', experienceTitle: 'Hidden Shrine Walk', date: '2026-03-10', pax: 3, price: 12000, currency: 'JPY', status: 'Cancelled' },
  { id: 'BK-1005', customerName: 'Evan Wright', experienceTitle: 'Samurai Experience', date: '2026-04-05', pax: 2, price: 20000, currency: 'JPY', status: 'Confirmed' },
];

export default function BookingsView() {
  const [timeRange, setTimeRange] = useState<number>(1); // Months
  const [bookings, setBookings] = useState<Booking[]>(MOCK_BOOKINGS);

  // Computed KPIs based on filtered bookings
  const filteredBookings = bookings.filter(b => {
    const bookingDate = new Date(b.date);
    const now = new Date();
    const cutoff = new Date();
    cutoff.setMonth(now.getMonth() + timeRange);
    return bookingDate >= now && bookingDate <= cutoff;
  });

  const totalRevenue = filteredBookings.filter(b => b.status !== 'Cancelled').reduce((acc, b) => acc + b.price, 0);
  const totalPax = filteredBookings.filter(b => b.status !== 'Cancelled').reduce((acc, b) => acc + b.pax, 0);
  const totalCount = filteredBookings.filter(b => b.status !== 'Cancelled').length;

  return (
    <Box sx={{ p: 4, bgcolor: 'transparent', minHeight: '80vh' }}>
      
      {/* Header & Filter */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontFamily: 'Agrandir, serif', fontWeight: 600, color: '#010057' }}>
          Bookings Dashboard
        </Typography>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <Select 
            value={timeRange} 
            onChange={(e) => setTimeRange(Number(e.target.value))}
            sx={{ bgcolor: 'white', borderRadius: 1, fontFamily: 'Nunito, sans-serif' }}
          >
            <MenuItem value={1}>Next 1 Month</MenuItem>
            <MenuItem value={2}>Next 2 Months</MenuItem>
            <MenuItem value={3}>Next 3 Months</MenuItem>
            <MenuItem value={6}>Next 6 Months</MenuItem>
            <MenuItem value={12}>Next 12 Months</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, bgcolor: 'white', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ p: 1.5, borderRadius: '50%', bgcolor: '#EFF6FF', color: '#010057' }}><EventIcon /></Box>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Nunito, sans-serif', fontWeight: 600 }}>Total Bookings</Typography>
              <Typography variant="h5" sx={{ fontFamily: 'Agrandir, serif', fontWeight: 700, color: '#0F172A' }}>{totalCount}</Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, bgcolor: 'white', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ p: 1.5, borderRadius: '50%', bgcolor: '#F0FDF4', color: '#10B981' }}><AttachMoneyIcon /></Box>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Nunito, sans-serif', fontWeight: 600 }}>Projected Revenue</Typography>
              <Typography variant="h5" sx={{ fontFamily: 'Agrandir, serif', fontWeight: 700, color: '#0F172A' }}>
                ¥{totalRevenue.toLocaleString()}
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, bgcolor: 'white', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ p: 1.5, borderRadius: '50%', bgcolor: '#FFF7ED', color: '#F97316' }}><GroupIcon /></Box>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Nunito, sans-serif', fontWeight: 600 }}>Passengers (Pax)</Typography>
              <Typography variant="h5" sx={{ fontFamily: 'Agrandir, serif', fontWeight: 700, color: '#0F172A' }}>{totalPax}</Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Booking Table */}
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#F8FAFC' }}>
            <TableRow>
              <TableCell sx={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700, color: '#64748B' }}>Booking ID</TableCell>
              <TableCell sx={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700, color: '#64748B' }}>Experience</TableCell>
              <TableCell sx={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700, color: '#64748B' }}>Customer</TableCell>
              <TableCell sx={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700, color: '#64748B' }}>Date</TableCell>
              <TableCell sx={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700, color: '#64748B' }}>Pax</TableCell>
              <TableCell sx={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700, color: '#64748B' }}>Price</TableCell>
              <TableCell sx={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700, color: '#64748B' }}>Status</TableCell>
              <TableCell sx={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700, color: '#64748B', textAlign:'right' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredBookings.length > 0 ? filteredBookings.map((b) => (
              <TableRow key={b.id} hover>
                <TableCell sx={{ fontFamily: 'Nunito, sans-serif', fontWeight: 600, color: '#010057' }}>{b.id}</TableCell>
                <TableCell sx={{ fontFamily: 'Nunito, sans-serif' }}>{b.experienceTitle}</TableCell>
                <TableCell sx={{ fontFamily: 'Nunito, sans-serif' }}>{b.customerName}</TableCell>
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
                    {b.status !== 'Cancelled' && (
                        <Button 
                            size="small" 
                            color="error" 
                            startIcon={<CancelIcon />} 
                            onClick={() => {
                                if (window.confirm('Cancel this booking?')) {
                                    setBookings(prev => prev.map(x => x.id === b.id ? { ...x, status: 'Cancelled' } : x));
                                }
                            }}
                            sx={{ textTransform:'none', fontFamily: 'Nunito, sans-serif' }}
                        >
                            Cancel
                        </Button>
                    )}
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4, color: '#94A3B8' }}>No bookings found for this period.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      {/* Calendar Placeholder (Visual) */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 4, mb: 2 }}>
        <CalendarMonthIcon sx={{ color: '#010057' }} />
        <Typography variant="h6" sx={{ fontFamily: 'Agrandir, serif', color: '#010057', fontWeight: 600 }}>Booking Calendar</Typography>
      </Stack>
      <Paper elevation={0} sx={{ p:4, textAlign:'center', border: '1px dashed #CBD5E1', borderRadius: 2, bgcolor: '#F8FAFC' }}>
         <Typography variant="body1" color="text.secondary">Calendar View Coming Soon...</Typography>
      </Paper>

    </Box>
  );
}
