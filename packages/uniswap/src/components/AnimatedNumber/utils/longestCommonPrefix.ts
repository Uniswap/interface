export function longestCommonPrefix(a: string, b: string): string {
  let i = 0
  while (a[i] && b[i] && a[i] === b[i]) {
    i++
  }
  return a.substring(0, i)
}
