'use client';

import { ReactNode } from 'react';
import { Web3Provider } from './Web3Provider';
import { Toaster } from 'react-hot-toast';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <Web3Provider>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#141B3A',
            color: '#FFFFFF',
            border: '1px solid rgba(123, 63, 242, 0.2)',
            borderRadius: '12px',
          },
          success: {
            iconTheme: {
              primary: '#00D9A3',
              secondary: '#FFFFFF',
            },
          },
          error: {
            iconTheme: {
              primary: '#FF5252',
              secondary: '#FFFFFF',
            },
          },
        }}
      />
    </Web3Provider>
  );
}
