import { useLocationLinkProps } from 'hooks/useLocationLinkProps'
import { useMemo } from 'react'
import { Trans } from 'react-i18next'
import { useAppDispatch } from 'state/hooks'
import { StyledInternalLink } from 'theme/components/Links'
import { Text } from 'ui/src'
import { DEFAULT_LOCALE, Language, Locale, mapLocaleToLanguage } from 'uniswap/src/features/language/constants'
import { navigatorLocale, useCurrentLocale, useLanguageInfo } from 'uniswap/src/features/language/hooks'
import { setCurrentLanguage } from 'uniswap/src/features/settings/slice'

const useTargetLocale = (activeLocale: Locale) => {
  const browserLocale = useMemo(() => navigatorLocale(), [])

  if (browserLocale && (browserLocale !== DEFAULT_LOCALE || activeLocale !== DEFAULT_LOCALE)) {
    if (activeLocale === browserLocale) {
      return DEFAULT_LOCALE
    } else {
      return browserLocale
    }
  }
  return null
}

export function SwitchLocaleLink() {
  const activeLocale = useCurrentLocale()
  const targetLocale = useTargetLocale(activeLocale)
  const targetLanguageInfo = useLanguageInfo(targetLocale ? mapLocaleToLanguage[targetLocale] : Language.English)
  const dispatch = useAppDispatch()

  const { to } = useLocationLinkProps(targetLocale)

  if (!targetLocale || !to) {
    return null
  }

  return (
    <Text fontSize={11} opacity={0.6} hoverStyle={{ opacity: 1 }} mt="1rem">
      <Trans
        i18nKey="common.availableIn"
        components={{
          locale: (
            <StyledInternalLink
              onClick={() => {
                dispatch(setCurrentLanguage(mapLocaleToLanguage[targetLocale]))
              }}
              to={to}
            >
              {targetLanguageInfo.displayName}
            </StyledInternalLink>
          ),
        }}
      />
    </Text>
  )
}
