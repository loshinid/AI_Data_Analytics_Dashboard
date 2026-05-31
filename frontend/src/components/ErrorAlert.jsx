export default function ErrorAlert({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div className="mb-4 flex items-start justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800">
      <p className="text-sm">{message}</p>
      {onDismiss && (
        <button onClick={onDismiss} className="ml-4 text-red-500 hover:text-red-700">
          ✕
        </button>
      )}
    </div>
  );
}
