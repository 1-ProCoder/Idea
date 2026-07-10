/**
 * Minimal `cn` helper to combine Tailwind class names without pulling in
 * clsx or tailwind-merge. Filters out falsy values and joins with a space.
 */
export function cn(
  ...inputs: Array<string | number | boolean | null | undefined>
): string {
  return inputs.filter((value) => Boolean(value)).join(' ');
}
