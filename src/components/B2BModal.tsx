import React from 'react';
import { AuthModal } from './AuthModal';
import { B2BUser, UserSession } from '../types';

interface B2BModalProps {
  b2bUser: B2BUser;
  onLoginSuccess: (companyName: string, cnpj: string) => void;
  onLogout: () => void;
  onClose: () => void;
}

export const B2BModal: React.FC<B2BModalProps> = ({
  b2bUser,
  onClose,
  onLoginSuccess
}) => {
  const currentSession: UserSession = {
    type: b2bUser.isLoggedIn ? 'b2b' : null,
    b2bUser: b2bUser.isLoggedIn ? b2bUser : undefined
  };

  return (
    <AuthModal
      isOpen={true}
      onClose={onClose}
      currentSession={currentSession}
      initialTab="b2b"
      onLoginSuccess={(session) => {
        if (session.type === 'b2b' && session.b2bUser) {
          onLoginSuccess(session.b2bUser.companyName, session.b2bUser.cnpj);
        }
      }}
    />
  );
};
