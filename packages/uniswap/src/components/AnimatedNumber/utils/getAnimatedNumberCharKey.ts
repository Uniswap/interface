export function getAnimatedNumberCharKey({
  index,
  charsLength,
  signColor,
}: {
  index: number
  charsLength: number
  signColor: string
}): string {
  return index === 0 ? `$_sign_${signColor}` : `$_number_${charsLength - index}`
}
