import { Language } from 'uniswap/src/features/language/constants'
import { useCurrentLanguage } from 'uniswap/src/features/language/hooks'

// For special Vietnamese characters that extend beyond the text frame,
// we do not apply line height to avoid truncating the text.
export function useRegionalizedLineHeight(): 'unset' | undefined {
  const currentLanguage = useCurrentLanguage()
  return currentLanguage === Language.Vietnamese ? 'unset' : undefined
}
