'use client';
import { ReactNode, useState, useEffect } from "react";
import { WalletKitProvider } from "@mysten/wallet-kit";

interface WalletContextProviderProps {
  children: ReactNode;
}

export function WalletContextProvider({ children }: WalletContextProviderProps) {
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      setMounted(true);
    } catch (err) {
      console.error('Error mounting wallet provider:', err);
      setError('Failed to initialize wallet provider');
    }
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="text-yellow-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Wallet Provider Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  try {
    return <WalletKitProvider>{children}</WalletKitProvider>;
  } catch (err) {
    console.error('WalletKitProvider error:', err);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="text-red-500 text-4xl mb-4">❌</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Wallet Connection Error</h2>
          <p className="text-gray-600 mb-4">
            Unable to connect to wallet services. Please check your internet connection and try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
}

export default WalletContextProvider;