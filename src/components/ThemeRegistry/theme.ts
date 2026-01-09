import { createTheme } from '@mui/material/styles';

// Import fonts
import '@fontsource/playfair-display/400.css';
import '@fontsource/playfair-display/500.css';
import '@fontsource/playfair-display/600.css';
import '@fontsource/playfair-display/700.css';
import '@fontsource/inter/300.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';

const theme = createTheme({
  palette: {
    primary: {
      main: '#010057', // Deep Blue
    },
    secondary: {
      main: '#ffbf00', // Gold
    },
    text: {
      primary: '#010057',
      secondary: '#4A7C8C', // Teal for muted text
    },
    background: {
      default: '#f8f9fa',
      paper: '#ffffff',
    },
  },
  shape: {
    borderRadius: 4, // 4px rounding
  },
  typography: {
    fontFamily: '"Inter", sans-serif',
    h1: {
      fontFamily: '"Playfair Display", serif',
      fontWeight: 600,
      color: '#010057',
    },
    h2: {
      fontFamily: '"Playfair Display", serif',
      fontWeight: 600,
      color: '#010057',
    },
    h3: {
      fontFamily: '"Playfair Display", serif',
      fontWeight: 600,
      color: '#010057',
    },
    h4: {
      fontFamily: '"Playfair Display", serif',
      fontWeight: 600,
      color: '#010057',
    },
    h5: {
      fontFamily: '"Playfair Display", serif',
      fontWeight: 500,
      color: '#010057',
    },
    h6: {
      fontFamily: '"Playfair Display", serif',
      fontWeight: 500,
      color: '#010057',
    },
    button: {
      fontFamily: '"Inter", sans-serif',
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '4px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        containedPrimary: {
          backgroundColor: '#010057',
          '&:hover': {
            backgroundColor: '#020080',
          },
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: `
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap');
      `,
    },
  },
});

export default theme;