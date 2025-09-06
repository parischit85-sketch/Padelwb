// =============================================
// FILE: src/lib/theme.js
// Theme System integrato con Design System - Adattivo
// =============================================
import { getThemeTokens } from './adaptive-theme.js';

export const LOGO_URL = '/play-sport-pro_horizontal.svg';

// Costanti di design unificate
export const THEME_CONSTANTS = {
  // Border radius unificato
  borderRadius: {
    sm: 'rounded-lg',
    md: 'rounded-xl',
    lg: 'rounded-2xl',
    full: 'rounded-full',
  },

  // Spacing consistente
  spacing: {
    xs: 'p-2',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8',
  },

  // Shadows unificati
  shadows: {
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    card: 'shadow-[0_0_0_1px_rgba(0,0,0,0.02)] shadow-sm',
  },

  // Transizioni standard
  transitions: {
    fast: 'transition-all duration-150 ease-in-out',
    normal: 'transition-all duration-200 ease-in-out',
    slow: 'transition-all duration-300 ease-in-out',
  },
};

export function themeTokens(isDark = false) {
  const adaptiveTokens = getThemeTokens(isDark);
  
  return {
    // Colori adattivi dal nuovo sistema
    ...adaptiveTokens,
    
    // Border radius unificato
    borderSm: THEME_CONSTANTS.borderRadius.sm,
    borderMd: THEME_CONSTANTS.borderRadius.md,
    borderLg: THEME_CONSTANTS.borderRadius.lg,
    borderFull: THEME_CONSTANTS.borderRadius.full,

    // Spacing unificato
    spacingXs: THEME_CONSTANTS.spacing.xs,
    spacingSm: THEME_CONSTANTS.spacing.sm,
    spacingMd: THEME_CONSTANTS.spacing.md,
    spacingLg: THEME_CONSTANTS.spacing.lg,
    spacingXl: THEME_CONSTANTS.spacing.xl,

    // Shadows unificati - Adattati al tema
    shadowCard: isDark ? 'shadow-xl shadow-black/30' : THEME_CONSTANTS.shadows.card,
    shadowSm: THEME_CONSTANTS.shadows.sm,
    shadowMd: THEME_CONSTANTS.shadows.md,
    shadowLg: THEME_CONSTANTS.shadows.lg,

    // Transizioni
    transitionFast: THEME_CONSTANTS.transitions.fast,
    transitionNormal: THEME_CONSTANTS.transitions.normal,
    transitionSlow: THEME_CONSTANTS.transitions.slow,

    // Focus ring adattivo
    focusRing: isDark 
      ? 'focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-800'
      : 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
    
    // Layout - Usando i token adattivi
    pageBg: adaptiveTokens.bgSecondary,
    headerBg: adaptiveTokens.cardBg,
    
    // Brand colors - Adattivi
    neonText: isDark ? 'text-emerald-400' : 'text-emerald-600',
    link: isDark 
      ? 'underline underline-offset-4 decoration-blue-400 hover:text-blue-300'
      : 'underline underline-offset-4 decoration-blue-600 hover:text-blue-700',
    ghostRing: isDark 
      ? 'ring-slate-600 hover:bg-slate-700'
      : 'ring-black/10 hover:bg-black/5',
    tableHeadText: adaptiveTokens.textMuted,
    
    // Buttons adattivi
    btnPrimary: `inline-flex items-center justify-center ${THEME_CONSTANTS.borderRadius.md} px-4 py-2 font-medium ${isDark ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'} ${THEME_CONSTANTS.transitions.normal} ${THEME_CONSTANTS.shadows.sm}`,
    btnGhost: `inline-flex items-center justify-center ${THEME_CONSTANTS.borderRadius.md} px-4 py-2 font-medium ${isDark ? 'ring-1 ring-slate-600 hover:bg-slate-700' : 'ring-1 ring-black/10 hover:bg-black/5'} ${THEME_CONSTANTS.transitions.normal}`,
    btnGhostSm: `inline-flex items-center justify-center ${THEME_CONSTANTS.borderRadius.sm} px-2 py-1 text-xs font-medium ${isDark ? 'ring-1 ring-slate-600 hover:bg-slate-700' : 'ring-1 ring-black/10 hover:bg-black/5'} ${THEME_CONSTANTS.transitions.normal}`,

    // Status colors adattivi - Eredità dai token
    accentGood: adaptiveTokens.success,
    accentBad: adaptiveTokens.error,
    accentWarning: adaptiveTokens.warning,
    accentInfo: adaptiveTokens.info,

    // Stati background - Adattivi
    successBg: isDark ? 'bg-emerald-900/20' : 'bg-emerald-50',
    errorBg: isDark ? 'bg-red-900/20' : 'bg-red-50',
    warningBg: isDark ? 'bg-amber-900/20' : 'bg-amber-50',
    infoBg: isDark ? 'bg-blue-900/20' : 'bg-blue-50',

    // Components adattivi
    chip: isDark ? 'bg-blue-600 text-white' : 'bg-emerald-500 text-black',
    
    // Cards unificati - Adattivi
    card: `${THEME_CONSTANTS.borderRadius.lg} ${adaptiveTokens.cardBg} ${THEME_CONSTANTS.spacing.md} ${isDark ? 'shadow-xl shadow-black/30' : THEME_CONSTANTS.shadows.card}`,
  };
}
