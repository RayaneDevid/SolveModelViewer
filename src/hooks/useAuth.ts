import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import { getProfile } from '@/api/auth';

export function useAuthInit() {
  const { setUser, setLoading, logout } = useAuthStore();

  useEffect(() => {
    let mounted = true;

    async function restoreSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const profile = await getProfile();
          if (mounted) setUser(profile);
        }
      } catch {
        // Session invalide ou profil inaccessible — on reste déconnecté sans appeler logout()
      } finally {
        if (mounted) setLoading(false);
      }
    }

    restoreSession();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === 'SIGNED_OUT' || !session) {
        logout();
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [setUser, setLoading, logout]);
}
