import { IconMessage2, IconCalendar, IconClock } from '@tabler/icons-react';

// constant
const icons = {
  IconMessage2,
  IconCalendar,
  IconClock
};

// ==============================|| CHAT MENU ITEMS ||============================== //

const chat = {
  id: 'main-navigation',
  title: '',
  type: 'group',
  children: [
    {
      id: 'conversations',
      title: 'Conversations',
      type: 'item',
      url: '/chat/conversations',
      icon: icons.IconMessage2,
      breadcrumbs: false
    },
    {
      id: 'bookings',
      title: 'Bookings',
      type: 'item',
      url: '/chat/bookings',
      icon: icons.IconCalendar,
      breadcrumbs: false
    },
    {
      id: 'schedule',
      title: 'Schedule',
      type: 'item',
      url: '/chat/schedule',
      icon: icons.IconClock,
      breadcrumbs: false
    }
  ]
};

export default chat;