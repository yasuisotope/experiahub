import { createTheme } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface TypographyVariants {
    display1: React.CSSProperties;
    display2: React.CSSProperties;
  }

  interface TypographyVariantsOptions {
    display1?: React.CSSProperties;
    display2?: React.CSSProperties;
  }
}

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    display1: true;
    display2: true;
  }
}

const theme = createTheme({
  palette: {
    primary: {
      main: 'rgba(74, 124, 140, 0.9)',
    },
    secondary: {
      main: 'rgba(255, 183, 107, 0.9)',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    text: {
      primary: '#4A4A4A',
      secondary: '#666666',
    },
  },
  typography: {
    fontFamily: 'Urbanist, sans-serif',
    h1: {
      fontFamily: 'Cormorant Garamond, serif',
      color: '#4A4A4A',
    },
    h2: {
      fontFamily: 'Cormorant Garamond, serif',
      color: '#4A4A4A',
    },
    h3: {
      fontFamily: 'Cormorant Garamond, serif',
      color: '#4A4A4A',
    },
    h4: {
      fontFamily: 'Cormorant Garamond, serif',
      color: '#4A4A4A',
    },
    h5: {
      fontFamily: 'Cormorant Garamond, serif',
      color: '#4A4A4A',
    },
    h6: {
      fontFamily: 'Cormorant Garamond, serif',
      color: '#4A4A4A',
    },
    body1: {
      fontFamily: 'Urbanist, sans-serif',
      color: '#666666',
    },
    body2: {
      fontFamily: 'Urbanist, sans-serif',
      color: '#666666',
    },
    subtitle1: {
      fontFamily: 'Urbanist, sans-serif',
      color: '#666666',
    },
    subtitle2: {
      fontFamily: 'Urbanist, sans-serif',
      color: '#666666',
    },
    button: {
      fontFamily: 'Urbanist, sans-serif',
      textTransform: 'none',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#f5f5f5',
        },
      },
    },
    MuiListItemText: {
      styleOverrides: {
        primary: {
          color: '#666666',
          fontFamily: 'Urbanist, sans-serif',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          fontFamily: 'Urbanist, sans-serif',
          textTransform: 'none',
        },
      },
    },
  },
});

export default theme;