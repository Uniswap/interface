export const roundAndPluralize = (i: number, word: string) => {
  const rounded = Math.floor(i)

  return `${rounded} ${word}${rounded === 1 ? '' : 's'}`
}

export const pluralize = (number: number) => (number !== 1 ? 's' : '')
