import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { getProfile } from '@/api/auth';
import { useAuthStore } from '@/stores/auth';
import { Spinner } from '@/components/ui/Spinner';

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleCallback() {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
          setError('Connexion refusée ou expirée. Réessaie.');
          return;
        }

        const profile = await getProfile();
        setUser(profile);
        navigate('/', { replace: true });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erreur de connexion');
      }
    }

    handleCallback();
  }, [navigate, setUser]);

  if (error) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4" style={{ backgroundColor: '#0a0a0f' }}>
        <p className="text-red-400 text-sm">{error}</p>
        <button
          onClick={() => navigate('/', { replace: true })}
          className="text-sm text-blurple hover:underline"
        >
          Retour à l'accueil
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center gap-4" style={{ backgroundColor: '#0a0a0f' }}>
      <Spinner size="lg" />
      <p className="text-white/40 text-sm">Connexion en cours…</p>
    </div>
  );
}
