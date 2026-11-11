import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { aideStore } from '@/lib/aideStore';
import { LEGAL } from '@/lib/legal-config';
import { capitalizeName } from '@/lib/names';

const AuthContext = createContext();

function toUser(u) {
  if (!u) return null;
  const given = u.user_metadata?.full_name || u.user_metadata?.name;
  return {
    id: u.id,
    email: u.email,
    full_name: given ? capitalizeName(given) : u.email,
    role: 'user',
    providers: u.app_metadata?.providers || [u.app_metadata?.provider].filter(Boolean),
  };
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  // true while someone who opened a password-reset email link chooses a new password
  const [recovering, setRecovering] = useState(() => window.location.hash.includes('type=recovery'));

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(toUser(data.session?.user));
      setIsLoadingAuth(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') setRecovering(true);
      if (!session) aideStore.reset(); // don't leave one teacher's chat for the next person
      setUser(toUser(session?.user));
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: capitalizeName(fullName),
          terms_accepted_at: new Date().toISOString(),
          terms_version: LEGAL.updated,
        },
      },
    });
    if (error) throw error;
    return { needsConfirmation: !data.session };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) throw error;
  };

  // Emails a reset link (works for any account with a verified email)
  const resetPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
    if (error) throw error;
  };

  // Used by the reset-link screen
  const updatePassword = async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    setRecovering(false);
  };

  // Used by the profile menu: checks the old password first
  const changePassword = async (oldPassword, newPassword) => {
    const { data } = await supabase.auth.getUser();
    const { error: oldErr } = await supabase.auth.signInWithPassword({ email: data.user?.email, password: oldPassword });
    if (oldErr) throw new Error('Your current password is incorrect.');
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    aideStore.reset();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoadingAuth,
        isLoadingPublicSettings: false,
        authError: null,
        appPublicSettings: null,
        recovering,
        signIn,
        signUp,
        signInWithGoogle,
        resetPassword,
        updatePassword,
        changePassword,
        logout,
        navigateToLogin: () => {},
        checkAppState: () => {},
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
