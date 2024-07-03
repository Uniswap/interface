import { DEFAULT_LOCALE, LOCALE_LABEL, SupportedLocale } from 'constants/locales'
import { navigatorLocale, useActiveLocale } from 'hooks/useActiveLocale'
import { useLocationLinkProps } from 'hooks/useLocationLinkProps'
import { Trans } from 'i18n'
import { useMemo } from 'react'
import { useUserLocaleManager } from 'state/user/hooks'
import { StyledInternalLink } from 'theme/components'
import { Text } from 'ui/src'

const useTargetLocale = (activeLocale: SupportedLocale) => {
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
  const activeLocale = useActiveLocale()
  const targetLocale = useTargetLocale(activeLocale)
  const [, setUserLocale] = useUserLocaleManager()

  const { to, onClick } = useLocationLinkProps(targetLocale)

  if (!targetLocale || !to) {
    return null
  }

  return (
    <Text fontSize={11} opacity={0.6} hoverStyle={{ opacity: 1 }} mt="1rem">
      <Trans i18nKey="common.availableIn" />
      <StyledInternalLink
        onClick={() => {
          onClick?.()
          setUserLocale(targetLocale)
        }}
        to={to}
      >
        {LOCALE_LABEL[targetLocale]}
      </StyledInternalLink>
    </Text>
  )
}
