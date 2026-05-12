import { createTheme, type ThemeOptions } from '@mui/material/styles';

/**
 * MUI theme — Kudwa product look.
 */

const tokens = {
  // Canvas + surfaces
  canvas:     '#f5f1e8', // warm cream background
  card:       '#ffffff', // raised surfaces
  cardAlt:    '#faf8f3', // subtle alternate surface (e.g. header strips)
  // Text
  ink:        '#0d0d0d', // primary text
  ink2:       '#6b6660', // secondary text
  ink3:       '#a8a39a', // tertiary / hairline labels
  // Borders & dividers
  rule:       '#e8e2d4', // hairlines
  ruleStrong: '#d4cdbb', // emphasized borders
  // Accents
  chartreuse:        '#dcfa3c', // primary action + active nav
  chartreuseHover:   '#c8e632',
  chartreuseInk:     '#0d0d0d', // text color on chartreuse surfaces
  // Semantic (muted, matching reference pill colors)
  positive:     '#2d8659',
  positiveBg:   '#dff5e7',
  negative:     '#c44545',
  negativeBg:   '#fde4e4',
  warning:      '#b8770f',
  warningBg:    '#fff0d4',
};

const themeOptions: ThemeOptions = {
  palette: {
    mode: 'light',
    primary: {
      main: tokens.chartreuse,
      dark: tokens.chartreuseHover,
      contrastText: tokens.chartreuseInk,
    },
    background: { default: tokens.canvas, paper: tokens.card },
    text: { primary: tokens.ink, secondary: tokens.ink2 },
    success: { main: tokens.positive },
    error: { main: tokens.negative },
    warning: { main: tokens.warning },
    divider: tokens.rule,
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
    // Single typeface throughout — Inter at varying weights handles display + body + numbers.
    h1: { fontWeight: 600, letterSpacing: '-0.02em' },
    h2: { fontWeight: 600, letterSpacing: '-0.02em' },
    h3: { fontWeight: 600, letterSpacing: '-0.015em' },
    h4: { fontWeight: 600, letterSpacing: '-0.01em' },
    h5: { fontWeight: 600, letterSpacing: '-0.01em' },
    h6: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600, letterSpacing: '-0.005em' },
    body1: { fontSize: '0.9rem' },
    body2: { fontSize: '0.85rem' },
    caption: { color: tokens.ink2, fontSize: '0.75rem' },
    overline: {
      fontSize: '0.7rem',
      letterSpacing: '0.08em',
      fontWeight: 600,
      color: tokens.ink2,
      textTransform: 'uppercase',
      lineHeight: 1.4,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: tokens.canvas, color: tokens.ink },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: `1px solid ${tokens.rule}`,
          backgroundColor: tokens.card,
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 999, // pill
          paddingInline: 18,
          paddingBlock: 8,
          fontSize: '0.85rem',
        },
        containedPrimary: {
          backgroundColor: tokens.chartreuse,
          color: tokens.chartreuseInk,
          '&:hover': { backgroundColor: tokens.chartreuseHover, boxShadow: 'none' },
        },
        outlined: {
          borderColor: tokens.ruleStrong,
          color: tokens.ink,
          '&:hover': { borderColor: tokens.ink, backgroundColor: 'transparent' },
        },
      },
    },
    MuiToggleButtonGroup: {
      styleOverrides: {
        root: {
          backgroundColor: tokens.card,
          border: `1px solid ${tokens.rule}`,
          borderRadius: 999,
          padding: 3,
          gap: 2,
        },
        grouped: {
          border: 0,
          '&:not(:first-of-type)': { borderRadius: 999 },
          '&:first-of-type': { borderRadius: 999 },
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          border: 0,
          borderRadius: 999,
          paddingInline: 14,
          paddingBlock: 5,
          fontSize: '0.78rem',
          fontWeight: 600,
          color: tokens.ink2,
          textTransform: 'none',
          '&.Mui-selected': {
            backgroundColor: tokens.ink,
            color: tokens.card,
            '&:hover': { backgroundColor: tokens.ink },
          },
          '&:hover': { backgroundColor: 'transparent', color: tokens.ink },
        },
      },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundColor: tokens.canvas,
          color: tokens.ink,
          borderBottom: `1px solid ${tokens.rule}`,
          boxShadow: 'none',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          fontWeight: 600,
          fontSize: '0.72rem',
          height: 22,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottomColor: tokens.rule,
          fontSize: '0.85rem',
        },
        head: {
          fontWeight: 600,
          fontSize: '0.7rem',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: tokens.ink2,
          backgroundColor: tokens.cardAlt,
          borderBottom: `1px solid ${tokens.rule}`,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          fontFamily: '"Inter", system-ui, sans-serif',
          fontSize: '0.78rem',
          backgroundColor: tokens.ink,
        },
        arrow: { color: tokens.ink },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 10, border: `1px solid ${tokens.rule}` },
      },
    },
  },
};

export const theme = createTheme(themeOptions);

/** Re-exported design tokens for places where MUI's theme isn't available (e.g. Recharts). */
export const designTokens = tokens;
