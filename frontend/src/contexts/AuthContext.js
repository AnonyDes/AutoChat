import { createContext, useContext, useState, useEffect } from "react";
import supabase from "../lib/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email, password) => {
    // First try to sign up
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin + '/dashboard',
      },
    });

    // Handle user already exists - try signing in instead
    if (error) {
      if (error.message.toLowerCase().includes("already registered") ||
          error.message.toLowerCase().includes("already exists") ||
          error.status === 422) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        return signInData;
      }
      // Handle rate limit - still allow progression
      if (error.message.toLowerCase().includes("rate limit")) {
        return { user: { email }, session: null, rateLimited: true };
      }
      throw error;
    }

    // Check if user was created but has no identities (Supabase duplicate user indicator)
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw new Error("This email is already registered. Please log in instead.");
      return signInData;
    }

    // If session exists, user is auto-confirmed and logged in
    if (data.session) return data;

    // If no session (email confirmation might be enabled), try signing in
    try {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (!signInError && signInData.session) return signInData;
    } catch {
      // Silent fail
    }

    // Return signup data even without session - onboarding will continue
    return data;
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message.includes("Email not confirmed")) {
        throw new Error("Email not confirmed. Please check your inbox or contact support.");
      }
      throw error;
    }
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
