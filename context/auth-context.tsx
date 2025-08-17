'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, 
         createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, getIdToken } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { FirebaseUser, User, UserRole } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface AuthContextProps {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  registerWithEmail: (email: string, password: string, role?: UserRole) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      
      if (firebaseUser) {
        // Get the ID token
        try {
          const token = await getIdToken(firebaseUser, true);
          
          // Set basic firebase user info
          setFirebaseUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || undefined,
            photoURL: firebaseUser.photoURL || undefined,
          });
          
          // Fetch additional user data from Firestore
          try {
            const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
            console.log('User doc data:', userDoc.data());
            if (userDoc.exists()) {
              const userData = userDoc.data() as User;
              // Add the token to the user data
              setUser({ ...userData, token });
            } else {
              // If user document doesn't exist in Firestore, user might have just registered
              // We'll rely on the registration function to create their user document
              setUser(null);
            }
          } catch (error) {
            console.error('Error fetching user data:', error);
            toast({
              title: 'Error',
              description: 'Failed to fetch user data. Please try again later.',
              variant: 'destructive',
            });
          }
        } catch (error) {
          console.error('Error getting ID token:', error);
          toast({
            title: 'Error',
            description: 'Failed to get authentication token. Please try logging in again.',
            variant: 'destructive',
          });
          // Sign out the user if we can't get their token
          await signOut(auth);
        }
      } else {
        // User is signed out
        setFirebaseUser(null);
        setUser(null);
      }
      
      setLoading(false);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, [toast]);

  // Sign in with email and password
  const signInWithEmail = async (email: string, password: string) => {
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      
      // Auth state change listener will handle updating the user state
      toast({
        title: 'Success',
        description: 'Signed in successfully!',
      });
      
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Sign in error:', error);
      let errorMessage = 'Failed to sign in. Please check your credentials.';
      
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = 'Invalid email or password. Please try again.';
      }
      
      toast({
        title: 'Sign In Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      
      // Configure provider
      provider.setCustomParameters({
        prompt: 'select_account',
        login_hint: 'user@example.com'
      });

      console.log('Initiating Google sign-in...');
      const result = await signInWithPopup(auth, provider);
      console.log('Google sign-in successful:', result.user.email);

      if (!result.user) {
        throw new Error('No user data returned from Google sign in');
      }

      // Create/update user document in Firestore
      const userDocRef = doc(db, 'users', result.user.uid);
      
      // Only set role to 'USER_ADMIN' if user doc does not exist
      const userDocSnap = await getDoc(userDocRef);
      let userData;
      if (userDocSnap.exists()) {
        // Keep existing role and update other fields
        userData = {
          ...userDocSnap.data(),
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL,
          lastLogin: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
      } else {
        // New user, set default role
        userData = {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL,
          role: 'USER_ADMIN',
          status: 'active',
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
      }
      await setDoc(userDocRef, userData, { merge: true });
      console.log('Firestore update successful');

      toast({
        title: 'Success',
        description: 'Signed in with Google successfully!',
      });

      router.push('/dashboard');
    } catch (error: any) {
      console.error('Detailed Google sign-in error:', {
        code: error.code,
        message: error.message,
        fullError: error
      });

      let errorMessage = 'Failed to sign in with Google. Please try again.';
      let title = 'Sign In Error';

      switch (error.code) {
        case 'auth/popup-closed-by-user':
          errorMessage = 'Sign-in window was closed. Please try again.';
          title = 'Sign In Cancelled';
          break;
        case 'auth/popup-blocked':
          errorMessage = 'Pop-up was blocked by your browser. Please allow pop-ups and try again.';
          title = 'Pop-up Blocked';
          break;
        case 'auth/unauthorized-domain':
          errorMessage = 'This domain is not authorized for Google sign-in. Please contact support.';
          title = 'Domain Error';
          break;
        default:
          errorMessage = `Authentication failed: ${error.message}`;
      }

      toast({
        title,
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Register with email and password
  const registerWithEmail = async (email: string, password: string, role: UserRole = 'USER_ADMIN') => {
    try {
      setLoading(true);
      
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const { user: newUser } = userCredential;
      
      // Create user document in Firestore
      await setDoc(doc(db, 'users', newUser.uid), {
        uid: newUser.uid,
        email: newUser.email,
        displayName: newUser.displayName || email.split('@')[0],
        photoURL: newUser.photoURL,
        role, // Use provided role or default to USER_ADMIN
        status: 'active',
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      });
      
      toast({
        title: 'Success',
        description: 'Account created successfully!',
      });
      
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Registration error:', error);
      let errorMessage = 'Failed to create account. Please try again.';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Email is already in use. Please use a different email or sign in.';
      }
      
      toast({
        title: 'Registration Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await signOut(auth);
      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out.',
      });
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: 'Error',
        description: 'Failed to log out. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const userData = await response.json();
      setUser(userData);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const value = {
    user,
    firebaseUser,
    loading,
    signInWithEmail,
    signInWithGoogle,
    logout,
    registerWithEmail,
    login,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};