import { defineConfig } from 'markr'

export default defineConfig({
  title: 'hsimah.com',
  fonts: {
    sans: {
      family: 'Oxanium',
      url: 'https://fonts.googleapis.com/css2?family=Oxanium:wght@200..800&display=swap',
    },
    mono: {
      family: 'Fira Code',
      url: 'https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&display=swap',
    },
    serif: {
      family: 'Merriweather',
      url: 'https://fonts.googleapis.com/css2?family=Merriweather:ital,opsz,wght@0,18..144,300..900;1,18..144,300..900&display=swap',
    },
  },
  colors: {
    background: 'oklch(0.9940 0 0)',
    foreground: 'oklch(0 0 0)',
    card: 'oklch(0.9940 0 0)',
    cardForeground: 'oklch(0 0 0)',
    primary: 'oklch(0.8545 0.1675 159.6564)',
    primaryForeground: 'oklch(0 0 0)',
    secondary: 'oklch(0.9933 0.0011 197.1390)',
    secondaryForeground: 'oklch(0.1344 0 0)',
    muted: 'oklch(0.9702 0 0)',
    mutedForeground: 'oklch(0.4386 0 0)',
    accent: 'oklch(0.9947 0.0074 164.9465)',
    accentForeground: 'oklch(0.6184 0.1489 155.4444)',
    border: 'oklch(0.9722 0.0034 247.8581)',
    ring: 'oklch(0.8545 0.1675 159.6564)',
  },
  darkColors: {
    background: 'oklch(0 0 0)',
    foreground: 'oklch(0.9551 0 0)',
    card: 'oklch(0.1448 0 0)',
    cardForeground: 'oklch(0.9551 0 0)',
    primary: 'oklch(0.8545 0.1675 159.6564)',
    primaryForeground: 'oklch(0 0 0)',
    secondary: 'oklch(0.4700 0.0900 160.0079)',
    secondaryForeground: 'oklch(0.9551 0 0)',
    muted: 'oklch(0.2653 0.0037 286.1465)',
    mutedForeground: 'oklch(0.6731 0 0)',
    accent: 'oklch(0.3004 0.0609 159.8938)',
    accentForeground: 'oklch(0.9970 0 0)',
    border: 'oklch(0.2138 0.0019 286.2347)',
    ring: 'oklch(0.8545 0.1675 159.6564)',
  },
})
