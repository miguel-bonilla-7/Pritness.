/** Spinner de recarga (animación Uiverse.io). Usado en cargas y al recargar la página. */
export function PageSpinner({ message }: { message?: string }) {
  return (
    <div className="min-h-screen bg-app flex flex-col items-center justify-center gap-6 p-4">
      <div className="relative w-12 h-12 flex items-center justify-center">
        <div
          className="spinner"
          style={{ transform: 'scale(4)' }}
          aria-hidden
        >
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} />
          ))}
        </div>
      </div>
      {message && (
        <p className="text-gray-400 text-sm text-center max-w-[200px]">
          {message}
        </p>
      )}
    </div>
  )
}
