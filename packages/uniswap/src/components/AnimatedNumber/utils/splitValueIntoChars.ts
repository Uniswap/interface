export function splitValueIntoChars(value: string | undefined): string[] {
  return value ? value.split('') : []
}
