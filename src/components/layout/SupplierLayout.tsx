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

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#F4F6F8' }}>
       {/* Main Content Area */}
       <Box component="main" sx={{ flexGrow: 1, overflow: 'auto' }}>
         {children}
       </Box>
    </Box>
  );
}
