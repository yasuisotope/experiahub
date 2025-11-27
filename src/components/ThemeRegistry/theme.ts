import { createTheme } from '@mui/material/styles';

// Import fonts
import '@fontsource/cormorant-garamond/400.css';
import '@fontsource/cormorant-garamond/500.css';
import '@fontsource/cormorant-garamond/600.css';
import '@fontsource/cormorant-garamond/700.css';
import '@fontsource/urbanist/300.css';
import '@fontsource/urbanist/400.css';
import '@fontsource/urbanist/500.css';
import '@fontsource/urbanist/600.css';
import '@fontsource/urbanist/700.css';

const theme = createTheme({
  palette: {
    primary: {
      main: 'rgba(74, 124, 140, 0.9)',
    },
    secondary: {
      main: 'rgba(255, 183, 107, 0.9)',
    },
  },
  typography: {
    fontFamily: '"Urbanist", sans-serif',
    h1: {
      fontFamily: '"Cormorant Garamond", serif',
    },
    h2: {
      fontFamily: '"Cormorant Garamond", serif',
    },
    h3: {
      fontFamily: '"Cormorant Garamond", serif',
    },
    h4: {
      fontFamily: '"Cormorant Garamond", serif',
    },
    h5: {
      fontFamily: '"Cormorant Garamond", serif',
    },
    h6: {
      fontFamily: '"Cormorant Garamond", serif',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: `
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Urbanist:wght@300;400;500;600;700&display=swap');
      `,
    },
  },
});

export default theme;