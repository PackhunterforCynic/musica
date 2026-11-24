import { UserProfile } from '../types/user.types';

export interface UpdateUserProfileInput {
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
}

export interface UserAuthResponse {
  user: UserProfile;
  token: string;
}
