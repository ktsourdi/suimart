declare module 'next/navigation' {
  export function useRouter(): {
    push: (href: string) => void;
  };
}