import React from 'react';
import { useNavigate } from 'react-router-dom';
import { NeuralButton } from '../components/UIElements';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#020420] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* 404 Icon */}
        <div className="text-8xl">🔍</div>
        
        {/* Error Message */}
        <div className="space-y-4">
          <h1 className="text-6xl font-black text-[#00DC82]">404</h1>
          <h2 className="text-2xl font-bold text-white">Page Not Found</h2>
          <p className="text-slate-400">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <NeuralButton variant="primary" onClick={() => navigate(-1)}>
            ← Go Back
          </NeuralButton>
          <NeuralButton variant="secondary" onClick={() => navigate('/')}>
            🏠 Home
          </NeuralButton>
        </div>
      </div>
    </div>
  );
};
