/** Ícones em traço fino (SVG), sem bibliotecas externas. */
type P = { size?: number; className?: string; strokeWidth?: number };
const S = ({ size = 18, className, strokeWidth = 1.7, children }: P & { children: React.ReactNode }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>{children}</svg>
);
export const IconPin = (p: P) => <S {...p}><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></S>;
export const IconSparkle = (p: P) => <S {...p}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" /></S>;
export const IconShield = (p: P) => <S {...p}><path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6z" /><path d="M9 12l2 2 4-4" /></S>;
export const IconDrop = (p: P) => <S {...p}><path d="M12 3c3 4 6 7 6 11a6 6 0 0 1-12 0c0-4 3-7 6-11z" /></S>;
export const IconAward = (p: P) => <S {...p}><circle cx="12" cy="9" r="5" /><path d="M8.5 13 7 21l5-3 5 3-1.5-8" /></S>;
export const IconPhone = (p: P) => <S {...p}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" /></S>;
export const IconWhatsApp = (p: P) => <S {...p}><path d="M4 20l1.3-4A8 8 0 1 1 8 18.7z" /><path d="M9.5 9.5c0 2.5 2.5 5 5 5l1-1.5-2-1-1 .8a3.5 3.5 0 0 1-1.8-1.8l.8-1-1-2z" /></S>;
export const IconClock = (p: P) => <S {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></S>;
export const IconMenu = (p: P) => <S {...p}><path d="M4 7h16M4 12h16M4 17h10" /></S>;
export const IconClose = (p: P) => <S {...p}><path d="M6 6l12 12M18 6 6 18" /></S>;
export const IconBack = (p: P) => <S {...p}><path d="M15 5l-7 7 7 7" /></S>;
export const IconNext = (p: P) => <S {...p}><path d="M9 5l7 7-7 7" /></S>;
export const IconCheck = (p: P) => <S {...p}><path d="M5 12l5 5 9-10" /></S>;
export const IconCalendar = (p: P) => <S {...p}><rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4" /></S>;
export const IconInstagram = (p: P) => <S {...p}><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="4" /></S>;
export const IconHome = (p: P) => <S {...p}><path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z" /></S>;
export const IconList = (p: P) => <S {...p}><path d="M9 6h11M9 12h11M9 18h11M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2" /></S>;
export const IconUsers = (p: P) => <S {...p}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6" /></S>;
export const IconBottle = (p: P) => <S {...p}><path d="M9 10h6v10a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1zM10.5 10V3h3v7" /></S>;
export const IconImage = (p: P) => <S {...p}><rect x="3.5" y="5" width="17" height="14" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="M20.5 16l-5-5-8 8" /></S>;
export const IconChart = (p: P) => <S {...p}><path d="M4 20V10M10 20V4M16 20v-7M21 20H3" /></S>;
export const IconBell = (p: P) => <S {...p}><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z" /><path d="M10 20a2 2 0 0 0 4 0" /></S>;
export const IconPlus = (p: P) => <S {...p}><path d="M12 5v14M5 12h14" /></S>;
export const IconStar = ({ size = 14, className }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}><path d="M12 2.5l2.9 6 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.2 1.3-6.6L2.5 9.3l6.6-.8z" /></svg>
);
