/** Joins class names, skipping falsy values: cn('a', cond && 'b', undefined) -> 'a b'. */
export function cn(...classes: Array<string | false | null | undefined | 0>): string {
  return classes.filter(Boolean).join(' ');
}

export default cn;
