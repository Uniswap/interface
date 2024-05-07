import { useLocationLinkProps } from 'hooks/useLocationLinkProps'
import { Trans } from 'i18n'
import { useMemo } from 'react'
import { StyledInternalLink } from 'theme/components'
import { Text } from 'ui/src'
import { DEFAULT_LOCALE, LOCALE_LABEL, SupportedLocale } from '../../constants/locales'
import { navigatorLocale, useActiveLocale } from '../../hooks/useActiveLocale'

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

  const { to, onClick } = useLocationLinkProps(targetLocale)

  if (!targetLocale || !to) return null

  return (
    <Text fontSize={11} opacity={0.6} hoverStyle={{ opacity: 1 }} mt="1rem">
      <Trans>Uniswap available in: </Trans>
      <StyledInternalLink onClick={onClick} to={to}>
        {LOCALE_LABEL[targetLocale]}
      </StyledInternalLink>
    </Text>
  )
}
