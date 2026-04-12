import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  getLoggedInUser,
  loginUser,
  logoutUser,
  registerCandidate,
  type AuthResult,
  type CandidateProfile,
} from "@/lib/candidateAuth";
import { supabase } from "@/lib/supabase";

interface RegisterInput {
  email: string;
  password: string;
  profile: CandidateProfile;
  termsAcceptedAt: string;
  resumeFile?: File | null;
  signatureFile?: File | null;
}

interface LoginInput {
  email: string;
  password: string;
}

type AuthUser = Awaited<ReturnType<typeof getLoggedInUser>>;

interface AuthContextValue {
  user: AuthUser;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (input: LoginInput) => Promise<AuthResult>;
  register: (input: RegisterInput) => Promise<AuthResult>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadUser = async () => {
      setIsLoading(true);
      const currentUser = await getLoggedInUser();
      if (mounted) {
        setUser(currentUser);
        setIsLoading(false);
      }
    };

    void loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void loadUser();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (input: LoginInput) => {
    const result = await loginUser(input);
    setUser(await getLoggedInUser());
    return result;
  };

  const register = async (input: RegisterInput) => {
    const result = await registerCandidate(input);
    setUser(await getLoggedInUser());
    return result;
  };

  const logout = async () => {
    await logoutUser();
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
    }),
    [isLoading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
