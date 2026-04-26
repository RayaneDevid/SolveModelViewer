import { apiFetch } from '@/api/client';

export interface Profile {
  id: string;
  discord_id: string;
  username: string;
  avatar_url: string | null;
  is_admin: boolean;
  created_at: string;
}

export function getProfile(): Promise<Profile> {
  return apiFetch<Profile>('get-profile');
}

export function promoteAdmin(userId: string): Promise<void> {
  return apiFetch<void>('promote-admin', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId }),
  });
}
