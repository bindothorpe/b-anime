export interface User {
    email: string;
    username?: string;
    sub: string; // Auth0 user ID
  }