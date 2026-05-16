export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 border-4 border-purple-500/20 rounded-full" />
        <div className="absolute inset-0 border-4 border-t-purple-500 border-r-pink-500 border-b-transparent border-l-transparent rounded-full animate-spin" />
      </div>
    </div>
  )
}