import type { Product, Category } from './index';

export interface StoreTheme {
  accent: string;
  accentLight: string;
  accentDark: string;
  cta: string;
  ctaLight: string;
  bgPrimary: string;
  bgSecondary: string;
  bgMid: string;
  textMuted: string;
  textMutedLight: string;
  gradientAccent: string;
  gradientCta: string;
  shadowAccent: string;
  shadowCta: string;
  glowBg1: string;
  glowBg2: string;
}

export interface HeroConfig {
  badge: string;
  title: string[];
  description: string;
  cta: string;
  ctaSecondary: string;
  heroAlt: string;
  image: string;
  floatingBadgeTitle: string;
  floatingBadgeSub: string;
}

export interface BenefitConfig {
  icon: string;
  title: string;
  description: string;
}

export interface StoreConfig {
  id: 'tabacaria' | 'adega';
  name: string;
  slogan: string;
  whatsapp: string;
  niche: string;
  instagram: string;
  tiktok: string;
  hero: HeroConfig;
  theme: StoreTheme;
  benefits: BenefitConfig[];
  categories: Category[];
  products: Product[];
}
