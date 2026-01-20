// Design System Tokens
// All visual parameters are defined here - NO inline styles or one-off values allowed

export const tokens = {
  // Border Radii
  radii: {
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    full: '9999px',
    glass: '24px',
    tile: '20px',
    chip: '12px',
    button: '10px',
  },

  // Spacing Scale (4px base)
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    '3xl': '64px',
    sidebar: '72px',
    topbar: '64px',
  },

  // Blur Values
  blur: {
    glass: '20px',
    subtle: '8px',
    strong: '30px',
  },

  // Shadows
  shadows: {
    glass: '0 8px 32px rgba(0, 0, 0, 0.1)',
    tile: '0 4px 16px rgba(0, 0, 0, 0.08)',
    tileHover: '0 6px 24px rgba(0, 0, 0, 0.12)',
    glow: '0 0 20px rgba(59, 130, 246, 0.3)',
    inner: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)',
  },

  // Glass Colors (with alpha)
  glass: {
    white: 'rgba(255, 255, 255, 0.1)',
    whiteLight: 'rgba(255, 255, 255, 0.05)',
    whiteMedium: 'rgba(255, 255, 255, 0.15)',
    whiteStrong: 'rgba(255, 255, 255, 0.25)',
    dark: 'rgba(0, 0, 0, 0.1)',
    darkMedium: 'rgba(0, 0, 0, 0.2)',
  },

  // Border Colors
  borders: {
    light: 'rgba(255, 255, 255, 0.1)',
    medium: 'rgba(255, 255, 255, 0.2)',
    strong: 'rgba(255, 255, 255, 0.3)',
  },

  // Accent Colors
  colors: {
    blue: '#3B82F6',
    blueLight: '#60A5FA',
    blueDark: '#2563EB',
    teal: '#14B8A6',
    green: '#22C55E',
    greenLight: '#4ADE80',
    orange: '#F97316',
    red: '#EF4444',
    purple: '#8B5CF6',
    white: '#FFFFFF',
    textPrimary: 'rgba(255, 255, 255, 0.95)',
    textSecondary: 'rgba(255, 255, 255, 0.7)',
    textTertiary: 'rgba(255, 255, 255, 0.5)',
  },

  // Animation Durations
  animation: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
    verySlow: '800ms',
  },

  // Animation Easings
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },

  // Typography
  typography: {
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    sizes: {
      xs: '11px',
      sm: '13px',
      base: '15px',
      lg: '18px',
      xl: '22px',
      '2xl': '28px',
      '3xl': '36px',
    },
    weights: {
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeights: {
      tight: '1.2',
      normal: '1.5',
      relaxed: '1.75',
    },
  },
} as const

// CSS Custom Properties for use in stylesheets
export function getCSSVariables(): string {
  return `
    :root {
      /* Radii */
      --radius-sm: ${tokens.radii.sm};
      --radius-md: ${tokens.radii.md};
      --radius-lg: ${tokens.radii.lg};
      --radius-xl: ${tokens.radii.xl};
      --radius-full: ${tokens.radii.full};
      --radius-glass: ${tokens.radii.glass};
      --radius-tile: ${tokens.radii.tile};
      --radius-chip: ${tokens.radii.chip};
      --radius-button: ${tokens.radii.button};

      /* Spacing */
      --space-xs: ${tokens.spacing.xs};
      --space-sm: ${tokens.spacing.sm};
      --space-md: ${tokens.spacing.md};
      --space-lg: ${tokens.spacing.lg};
      --space-xl: ${tokens.spacing.xl};
      --space-2xl: ${tokens.spacing['2xl']};
      --space-3xl: ${tokens.spacing['3xl']};
      --sidebar-width: ${tokens.spacing.sidebar};
      --topbar-height: ${tokens.spacing.topbar};

      /* Blur */
      --blur-glass: ${tokens.blur.glass};
      --blur-subtle: ${tokens.blur.subtle};
      --blur-strong: ${tokens.blur.strong};

      /* Shadows */
      --shadow-glass: ${tokens.shadows.glass};
      --shadow-tile: ${tokens.shadows.tile};
      --shadow-tile-hover: ${tokens.shadows.tileHover};
      --shadow-glow: ${tokens.shadows.glow};
      --shadow-inner: ${tokens.shadows.inner};

      /* Glass Colors */
      --glass-white: ${tokens.glass.white};
      --glass-white-light: ${tokens.glass.whiteLight};
      --glass-white-medium: ${tokens.glass.whiteMedium};
      --glass-white-strong: ${tokens.glass.whiteStrong};
      --glass-dark: ${tokens.glass.dark};
      --glass-dark-medium: ${tokens.glass.darkMedium};

      /* Borders */
      --border-light: ${tokens.borders.light};
      --border-medium: ${tokens.borders.medium};
      --border-strong: ${tokens.borders.strong};

      /* Colors */
      --color-blue: ${tokens.colors.blue};
      --color-blue-light: ${tokens.colors.blueLight};
      --color-blue-dark: ${tokens.colors.blueDark};
      --color-teal: ${tokens.colors.teal};
      --color-green: ${tokens.colors.green};
      --color-green-light: ${tokens.colors.greenLight};
      --color-orange: ${tokens.colors.orange};
      --color-red: ${tokens.colors.red};
      --color-purple: ${tokens.colors.purple};
      --color-white: ${tokens.colors.white};
      --text-primary: ${tokens.colors.textPrimary};
      --text-secondary: ${tokens.colors.textSecondary};
      --text-tertiary: ${tokens.colors.textTertiary};

      /* Animation */
      --duration-fast: ${tokens.animation.fast};
      --duration-normal: ${tokens.animation.normal};
      --duration-slow: ${tokens.animation.slow};
      --duration-very-slow: ${tokens.animation.verySlow};
      --ease-default: ${tokens.easing.default};
      --ease-in: ${tokens.easing.in};
      --ease-out: ${tokens.easing.out};
      --ease-in-out: ${tokens.easing.inOut};
      --ease-bounce: ${tokens.easing.bounce};

      /* Typography */
      --font-family: ${tokens.typography.fontFamily};
      --text-xs: ${tokens.typography.sizes.xs};
      --text-sm: ${tokens.typography.sizes.sm};
      --text-base: ${tokens.typography.sizes.base};
      --text-lg: ${tokens.typography.sizes.lg};
      --text-xl: ${tokens.typography.sizes.xl};
      --text-2xl: ${tokens.typography.sizes['2xl']};
      --text-3xl: ${tokens.typography.sizes['3xl']};
      --font-regular: ${tokens.typography.weights.regular};
      --font-medium: ${tokens.typography.weights.medium};
      --font-semibold: ${tokens.typography.weights.semibold};
      --font-bold: ${tokens.typography.weights.bold};
    }
  `.trim()
}

export type Tokens = typeof tokens
