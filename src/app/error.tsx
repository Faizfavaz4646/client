'use client';

import { useEffect } from 'react';

type Props = {
  error: Error & { digest?: string }; //used digest for inernl tracking avoid using any blindly
  reset: () => void;
};

export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    // Log error to external service (Sentry, LogRocket, etc.)
    //Avoid logging on every render
    console.error("🚨 Global Error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="max-w-md w-full bg-white shadow-lg rounded-2xl p-6 text-center">
        
        {/* Error Title */}
        <h1 className="text-2xl font-semibold text-red-600 mb-2">
          Something went wrong
        </h1>

        {/* Error Message (only in dev) */}
        {process.env.NODE_ENV === 'development' && (
          <p className="text-sm text-gray-600 mb-4 break-words">
            {error.message}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Try Again
          </button>

          <button
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
          >
            Go Home
          </button>
        </div>

      </div>
    </div>
  );
}