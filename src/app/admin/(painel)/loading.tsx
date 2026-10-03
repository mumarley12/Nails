/** Aparece logo ao tocar num botão do painel, enquanto a página carrega. */
export default function Loading() {
  return (
    <div className="flex animate-pulse flex-col gap-5" aria-busy="true" aria-label="A carregar">
      <div className="h-9 w-56 rounded bg-[#ECECEC]" />
      <div className="h-4 w-80 max-w-full rounded bg-[#F0F0F0]" />
      <div className="card h-40" />
      <div className="card h-64" />
    </div>
  );
}
