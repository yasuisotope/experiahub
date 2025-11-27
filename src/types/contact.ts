type UserProfile = any;

export interface ContactStateProps {
  contacts: UserProfile[];
  error: object | string | null;
}
