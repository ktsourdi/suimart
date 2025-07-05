declare module 'next/font/google' {
  export interface GoogleFontOptions {
    subsets: string[];
    weight?: string | string[];
    style?: string | string[];
    variable?: string;
    display?: 'auto' | 'block' | 'swap' | 'fallback' | 'optional';
  }

  export function Inter(options: GoogleFontOptions): { className: string; style?: any }; // minimal typings
}