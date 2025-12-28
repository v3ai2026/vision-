import React from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import App from './App'; // Original AI Studio
import { AdminApp } from './AdminApp'; // New Admin System
import { NeuralButton } from './components/UIElements';

export const RootApp: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const isStudioMode = location.pathname === '/' || location.pathname === '/studio';

  const toggleMode = () => {
    if (isStudioMode) {
      navigate('/admin');
    } else {
      navigate('/studio');
    }
  };

  return (
    <>
      {/* App Toggle Button - Fixed position */}
      <div className="fixed top-4 right-4 z-[9999]">
        <NeuralButton
          onClick={toggleMode}
          variant="primary"
          size="sm"
          className="shadow-2xl"
        >
          {isStudioMode ? '🎛️ Admin' : '✨ Studio'}
        </NeuralButton>
      </div>

      {/* Routes */}
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/studio" element={<App />} />
        <Route path="/admin/*" element={<AdminApp />} />
        <Route path="*" element={<App />} />
      </Routes>
    </>
  );
};

export default RootApp;
