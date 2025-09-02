// =============================================
// FILE: src/lib/theme.js
// =============================================
export const LOGO_URL = '/logo.png';
export function themeTokens(theme = 'dark') {
  if (theme === 'light') {
    return {
      name: 'light',
      pageBg: 'bg-neutral-50',
      text: 'text-neutral-900',
      subtext: 'text-neutral-600',
      cardBg: 'bg-white',
      border: 'ring-1 ring-black/5',
      headerBg: 'backdrop-blur bg-white/70 border-b border-black/10',
      neonText: 'text-emerald-600',
      link: 'underline underline-offset-4 decoration-emerald-600 hover:text-emerald-700',
      ghostRing: 'ring-black/10 hover:bg-black/5',
      tableHeadText: 'text-neutral-500',
      input:
        'rounded-xl px-3 py-2 bg-white border border-black/10 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 outline-none transition',
      btnPrimary:
        'inline-flex items-center justify-center rounded-xl px-4 py-2 font-medium text-black bg-gradient-to-r from-emerald-400 to-lime-400 hover:brightness-110 active:brightness-95 transition',
      btnGhost:
        'inline-flex items-center justify-center rounded-xl px-4 py-2 font-medium ring-1 ring-black/10 hover:bg-black/5 transition',
      btnGhostSm:
        'inline-flex items-center justify-center rounded-lg px-2 py-1 text-xs font-medium ring-1 ring-black/10 hover:bg-black/5 transition',
      accentGood: 'text-emerald-600',
      accentBad: 'text-rose-600',
      chip: 'bg-emerald-500 text-black',
    };
  }
  return {
    name: 'dark',
    pageBg: 'bg-neutral-950',
    text: 'text-neutral-100',
    subtext: 'text-neutral-400',
    cardBg: 'bg-white/5',
    border: 'ring-1 ring-white/10',
    headerBg: 'backdrop-blur bg-black/30 border-b border-white/10',
    neonText: 'text-emerald-400',
    link: 'underline underline-offset-4 decoration-emerald-400 hover:text-emerald-300',
    ghostRing: 'ring-white/15 hover:bg-white/10',
    tableHeadText: 'text-neutral-300',
    input:
      'rounded-xl px-3 py-2 bg-neutral-900/60 ring-1 ring-white/10 focus:ring-emerald-400/60 outline-none transition',
    btnPrimary:
      'inline-flex items-center justify-center rounded-xl px-4 py-2 font-medium text-black bg-gradient-to-r from-emerald-400 to-lime-400 hover:brightness-110 active:brightness-95 transition',
    btnGhost:
      'inline-flex items-center justify-center rounded-xl px-4 py-2 font-medium ring-1 ring-white/15 hover:bg-white/10 transition',
    btnGhostSm:
      'inline-flex items-center justify-center rounded-lg px-2 py-1 text-xs font-medium ring-1 ring-white/15 hover:bg-white/10 transition',
    accentGood: 'text-emerald-400',
    accentBad: 'text-rose-400',
    chip: 'bg-gradient-to-r from-emerald-400 to-lime-400 text-black',
  };
}
