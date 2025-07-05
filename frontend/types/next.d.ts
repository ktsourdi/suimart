declare module 'next' {
  export interface Metadata {
    title?: string;
    description?: string;
    [key: string]: any;
  }
}

declare module 'next/navigation' {
  export interface Router {
    push: (href: string) => void;
  }
  export function useRouter(): Router;
}