declare module 'next/navigation' {
  export interface Router {
    push: (href: string) => void;
    replace: (href: string) => void;
    refresh: () => void;
  }
  export function useRouter(): Router;
}