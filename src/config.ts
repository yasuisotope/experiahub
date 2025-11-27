// third party
import { Roboto } from 'next/font/google';

// types
import { ConfigProps } from 'types/config';

export const DASHBOARD_PATH = '/dashboard/default';
export const HORIZONTAL_MAX_ITEM = 7;

const roboto = Roboto({ subsets: ['latin'], weight: ['300', '400', '500', '700'] });

export enum MenuOrientation {
  VERTICAL = 'vertical',
  HORIZONTAL = 'horizontal'
}

export enum ThemeMode {
  LIGHT = 'light',
  DARK = 'dark'
}

export enum ThemeDirection {
  LTR = 'ltr',
  RTL = 'rtl'
}

export enum AuthProvider {
  JWT = 'jwt',
  FIREBASE = 'firebase',
  AUTH0 = 'auth0',
  AWS = 'aws',
  SUPABASE = 'supabase'
}

export enum DropzopType {
  default = 'DEFAULT',
  standard = 'STANDARD'
}

export const APP_AUTH: AuthProvider = AuthProvider.JWT;

const config: ConfigProps = {
  menuOrientation: MenuOrientation.VERTICAL,
  miniDrawer: false,
  fontFamily: roboto.style.fontFamily,
  borderRadius: 8,
  outlinedFilled: true,
  mode: ThemeMode.LIGHT,
  presetColor: 'default',
  i18n: 'en',
  themeDirection: ThemeDirection.LTR,
  container: true
};

export default config;
