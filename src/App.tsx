import React, { useState } from 'react';
import { LockScreen } from './components/LockScreen';
import { WinGoBot } from './components/WinGoBot';

export default function App() {
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('ajmin_bot_auth') === 'authenticated';
    } catch {
      return false;
    }
  });

  const handleUnlock = () => {
    setIsUnlocked(true);
  };

  const handleLock = () => {
    try {
      sessionStorage.removeItem('ajmin_bot_auth');
    } catch {
      // ignore
    }
    setIsUnlocked(false);
  };

  return (
    <div className="w-full min-h-screen bg-[#080314] text-white">
      {!isUnlocked ? (
        <LockScreen onUnlock={handleUnlock} />
      ) : (
        <WinGoBot onLock={handleLock} />
      )}
    </div>
  );
}
