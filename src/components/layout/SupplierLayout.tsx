'use client';

import React from 'react';
import { Box, AppBar, Toolbar, Typography, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider, IconButton, Avatar, Button } from '@mui/material';
import { Dashboard as DashboardIcon, Inventory as ProductIcon, CalendarMonth as CalendarIcon, Logout as LogoutIcon } from '@mui/icons-material';
import { useRouter, usePathname } from 'next/navigation';
import { useSupplierAuth } from '@/contexts/SupplierAuthContext';
import Image from 'next/image';

const DRAWER_WIDTH = 280;

export default function SupplierLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useSupplierAuth();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const navItems = [
    { label: 'Dashboard', icon: <DashboardIcon />, path: '/supplier' },
    { label: 'Products', icon: <ProductIcon />, path: '/supplier/products' },
    { label: 'Bookings', icon: <CalendarIcon />, path: '/supplier/bookings' },
  ];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#F4F6F8' }}>
      {/* Supplier Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { 
            width: DRAWER_WIDTH, 
            boxSizing: 'border-box', 
            bgcolor: '#010057', 
            color: '#FFFFFF',
            borderRight: 'none'
          },
        }}
      >
        <Box sx={{ p: 3, textAlign: 'center' }}>
           <img
             src="https://res.cloudinary.com/dasahamyc/image/upload/v1764230944/ExperiaHub_Logo_mqqw7z.png"
             alt="ExperiaHub Supplier"
             style={{ height: 45, width: 'auto', filter: 'brightness(0) invert(1)' }}
           />
           <Typography variant="caption" display="block" sx={{ mt: 1, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 1 }}>
             Supplier Portal
           </Typography>
        </Box>
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
        <List sx={{ mt: 2 }}>
          {navItems.map((item) => (
            <ListItem key={item.path} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                onClick={() => router.push(item.path)}
                selected={pathname === item.path}
                sx={{
                  mx: 2,
                  borderRadius: 1,
                  '&.Mui-selected': { bgcolor: '#ffbf00', color: '#010057', '&:hover': { bgcolor: '#e5ac00' } },
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
                }}
              >
                <ListItemIcon sx={{ color: pathname === item.path ? '#010057' : 'rgba(255,255,255,0.7)' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: '0.95rem', fontWeight: 500 }} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <Box sx={{ mt: 'auto', p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
             <Avatar sx={{ width: 32, height: 32 }}>{user?.display_name?.[0]}</Avatar>
             <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                <Typography variant="body2" noWrap fontWeight={600} sx={{ color: '#fff' }}>{user?.display_name || 'Supplier'}</Typography>
                <Typography variant="caption" noWrap sx={{ color: 'rgba(255,255,255,0.6)' }}>{user?.email}</Typography>
             </Box>
             <IconButton size="small" onClick={handleLogout} sx={{ color: 'rgba(255,255,255,0.7)' }}><LogoutIcon fontSize="small" /></IconButton>
          </Box>
        </Box>
      </Drawer>

      {/* Main Content Area */}
      <Box component="main" sx={{ flexGrow: 1, p: 3, overflow: 'auto' }}>
        {children}
      </Box>
    </Box>
  );
}
