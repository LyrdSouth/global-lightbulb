'use client';

export default function ConnectionError() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 p-4">
      <div className="bg-red-800/20 border border-red-500 rounded-lg p-6 max-w-md">
        <h2 className="text-2xl font-bold text-red-400 mb-4">Connection Error</h2>
        <p className="text-white mb-4">
          Unable to connect to the database. This could be due to:
        </p>
        <ul className="list-disc list-inside text-gray-300 mb-6 space-y-2">
          <li>Missing or incorrect environment variables</li>
          <li>Supabase service is unavailable</li>
          <li>Network connectivity issues</li>
        </ul>
        <p className="text-gray-400 text-sm">
          Please check your .env.local file and make sure you&apos;ve set up Supabase correctly according to the README.
        </p>
      </div>
    </div>
  );
} 