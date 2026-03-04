"use client";

export default function MineError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-gray-900 border border-gray-700 rounded-lg p-8 text-center">
        <div className="text-red-400 text-4xl mb-4">⚠</div>
        <h1 className="text-white text-xl font-semibold mb-2">
          Mining encountered an error
        </h1>
        <p className="text-gray-400 text-sm mb-6">
          {error.message || "An unexpected error occurred during mining. Your progress has been saved."}
        </p>
        <button
          onClick={reset}
          className="bg-green-600 hover:bg-green-500 text-white font-medium px-6 py-2 rounded transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
