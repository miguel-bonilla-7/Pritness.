/** Spinner de carga: solo icono, tamaño pequeño, centrado. Sin texto. */
export function PageSpinner({ message }: { message?: string }) {
  return (
    <div className="min-h-screen bg-app flex flex-col items-center justify-center p-4">
      <div className="relative w-4 h-4 flex items-center justify-center">
        <div
          className="spinner spinner--xs"
          aria-hidden
        >
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} />
          ))}
        </div>
      </div>
      {message && (
        <p className="text-gray-400 text-xs text-center max-w-[180px] mt-3">
          {message}
        </p>
      )}
    </div>
  )
}
