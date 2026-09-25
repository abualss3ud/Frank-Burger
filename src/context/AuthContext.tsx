import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);

      if (firebaseUser) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (!userDocSnap.exists()) {
            // Check if there is a pending signup profile in localStorage
            const pendingStr = localStorage.getItem('pending_signup_profile');
            let profileData = {
              name: firebaseUser.displayName || 'User',
              phone: firebaseUser.phoneNumber || '',
              email: firebaseUser.email || '',
              createdAt: new Date().toISOString(),
              favorites: []
            };

            if (pendingStr) {
              try {
                const parsed = JSON.parse(pendingStr);
                profileData = {
                  name: parsed.name || profileData.name,
                  phone: parsed.phone || profileData.phone,
                  email: parsed.email || profileData.email,
                  createdAt: parsed.createdAt || profileData.createdAt,
                  favorites: []
                };
                localStorage.removeItem('pending_signup_profile');
              } catch (e) {
                console.error('Error parsing pending signup profile:', e);
              }
            }

            await setDoc(userDocRef, profileData);
            console.log('[AUTH] Successfully created user profile in Firestore:', firebaseUser.uid);
          }
        } catch (error) {
          console.error('[AUTH ERROR] Failed to sync user profile to Firestore:', error);
        }
      }
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
