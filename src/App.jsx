import React from 'react';
import { ToastProvider } from './components/common/Toast';
import { AppMain } from './AppMain';

export default function App() {
  return (
    <ToastProvider>
      <AppMain />
    </ToastProvider>
  );
}
