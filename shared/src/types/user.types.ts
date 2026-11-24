export interface UserProfile {
  id: string;
  email?: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface UserSession {
  userId: string;
  email?: string;
  token: string;
  expiresAt: number;
}
