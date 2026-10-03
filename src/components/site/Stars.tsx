/** Estrelas de 1 a 5 (só para mostrar). */
export function Stars({ value, className = "" }: { value: number; className?: string }) {
  return (
    <span role="img" aria-label={`${value} de 5 estrelas`} className={`inline-flex gap-0.5 ${className}`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width="15" height="15" viewBox="0 0 24 24" aria-hidden="true" fill={i <= value ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5">
          <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" strokeLinejoin="round" />
        </svg>
      ))}
    </span>
  );
}
