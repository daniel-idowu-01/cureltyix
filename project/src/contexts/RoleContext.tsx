import { createContext, useContext, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';

type UserRole = 'admin' | 'doctor' | 'patient';

interface RoleContextType {
  currentRole: UserRole;
  switchRole: (role: UserRole) => void;
  resetRole: () => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [viewAsRole, setViewAsRole] = useState<UserRole | null>(null);

  const currentRole = viewAsRole || (user?.role as UserRole) || 'patient';

  const switchRole = (role: UserRole) => {
    setViewAsRole(role);
  };

  const resetRole = () => {
    setViewAsRole(null);
  };

  return (
    <RoleContext.Provider value={{ currentRole, switchRole, resetRole }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}