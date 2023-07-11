/**
 * We have enabled allowedStyleValues: 'somewhat-strict-web' on createTamagui
 * which means our Tamagui components only accept valid tokens.
 * 
 * But, sometimes we want to accept one-off values that aren't in the design system
 * especially as we migrate over.
 * 
 * This basically is an empty function but its nicer than doing @ts-expect-error
 * It signifies we know this value is valid.

 */

// it would be a bit nicer if this was cast to Token
// but we'd need another new Tamagui release to support that (coming soon)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const validToken = (value: string): any => value
