
import React, { createContext, useContext, useState, useEffect } from "react";
import { User, loginUser, registerUser } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => boolean;
  register: (name: string, email: string, password: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check for saved user in localStorage on initial load
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Failed to parse saved user:", error);
        localStorage.removeItem("user");
      }
    }
  }, []);

  const login = (email: string, password: string): boolean => {
    const authenticatedUser = loginUser(email, password);
    
    if (authenticatedUser) {
      setUser(authenticatedUser);
      setIsAuthenticated(true);
      // Save user to localStorage (not secure for passwords, but ok for demo)
      localStorage.setItem("user", JSON.stringify(authenticatedUser));
      toast({
        title: "Login Successful",
        description: `Welcome back, ${authenticatedUser.name}!`,
      });
      return true;
    } else {
      toast({
        title: "Login Failed",
        description: "Invalid email or password",
        variant: "destructive",
      });
      return false;
    }
  };

  const register = (name: string, email: string, password: string): boolean => {
    try {
      const newUser = registerUser(name, email, password);
      setUser(newUser);
      setIsAuthenticated(true);
      localStorage.setItem("user", JSON.stringify(newUser));
      toast({
        title: "Registration Successful",
        description: `Welcome, ${name}!`,
      });
      return true;
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: "Something went wrong",
        variant: "destructive",
      });
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("user");
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
