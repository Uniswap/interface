export const roundAndPluralize = (i: number, word: string) => {
  const rounded = Math.floor(i)

  return `${rounded} ${word}${rounded === 1 ? '' : 's'}`
}
