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
      main: '#010057', // Deep Blue (Color #1)
    },
    secondary: {
      main: '#ffbf00', // Gold (Color #2)
    },
    info: {
      main: '#4A7C8C', // Muted Blue (Color #3)
    },
    background: {
      default: '#f8f9fa',
      paper: '#ffffff',
    },
    text: {
      primary: '#010057',
      secondary: '#4A7C8C',
    },
  },
  typography: {
    fontFamily: '"Nunito", sans-serif',
    h1: {
      fontFamily: '"Agrandir", serif',
      color: '#010057',
      fontWeight: 600,
    },
    h2: {
      fontFamily: '"Agrandir", serif',
      color: '#010057',
      fontWeight: 600,
    },
    h3: {
      fontFamily: '"Agrandir", serif',
      color: '#010057',
      fontWeight: 600,
    },
    h4: {
      fontFamily: '"Agrandir", serif',
      color: '#010057',
      fontWeight: 600,
    },
    h5: {
      fontFamily: '"Agrandir", serif',
      color: '#010057',
      fontWeight: 500,
    },
    h6: {
      fontFamily: '"Agrandir", serif',
      color: '#010057',
      fontWeight: 500,
    },
    body1: {
      fontFamily: '"Nunito", sans-serif',
      color: '#010057',
    },
    body2: {
      fontFamily: '"Nunito", sans-serif',
      color: '#666666',
    },
    button: {
      fontFamily: '"Nunito", sans-serif',
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: 'transparent',
          fontFamily: '"Nunito", sans-serif',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          textTransform: 'none',
        },
        containedPrimary: {
          backgroundColor: '#010057',
          '&:hover': {
            backgroundColor: '#020080',
          },
        },
      },
    },
  },
});

export default theme;