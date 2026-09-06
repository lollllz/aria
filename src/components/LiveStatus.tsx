export default function LiveStatus({
  message,
  assertive = false,
}: {
  message: string
  assertive?: boolean
}) {
  if (!message) return null
  return (
    <div
      role={assertive ? 'alert' : 'status'}
      aria-live={assertive ? 'assertive' : 'polite'}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  )
}
