import { ChainOutageData } from 'featureFlags/flags/outageBanner'
import { useTheme } from 'lib/styled-components'
import { useState } from 'react'
import { Globe, X } from 'react-feather'
import { Trans } from 'react-i18next'
import { ExternalLink } from 'theme/components/Links'
import { ClickableTamaguiStyle } from 'theme/components/styles'
import { capitalize } from 'tsafe'
import { Flex, Text, styled as tamaguiStyled } from 'ui/src'
import { iconSizes, zIndexes } from 'ui/src/theme'
import { useShadowPropsShort } from 'ui/src/theme/shadows'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getChainUrlParam } from 'utils/chainParams'

export function getOutageBannerSessionStorageKey(chainId: UniverseChainId) {
  return `hideOutageBanner-${chainId}`
}

// TODO replace with IconButton when it's available from buttons migration
export const OutageCloseButton = tamaguiStyled(X, {
  ...ClickableTamaguiStyle,
  size: iconSizes.icon24,
  p: '$spacing4',
  right: 6,
  top: 8,
  borderRadius: '50%',
  backgroundColor: '$surface5',
  color: '$neutral2',
  position: 'absolute',
})

export function OutageBanner({ chainId, version }: ChainOutageData) {
  const [hidden, setHidden] = useState(false)
  const theme = useTheme()
  const versionName = version ? version.toString().toLowerCase() + ' data' : 'Data'
  const { defaultChainId } = useEnabledChains()
  const chainName = capitalize(getChainUrlParam(chainId ?? defaultChainId))
  const versionDescription = version ? ' ' + version.toString().toLowerCase() : ''
  const shadowProps = useShadowPropsShort()

  if (hidden) {
    return null
  }

  return (
    <Flex
      width={360}
      maxWidth="95%"
      backgroundColor={theme.surface1}
      zIndex={zIndexes.sticky}
      borderRadius="$rounded20"
      borderStyle="solid"
      borderWidth={1.3}
      borderColor={theme.surface3}
      $platform-web={{
        position: 'fixed',
        bottom: 40,
        right: 20,
        ...(shadowProps['$platform-web'] || {}),
      }}
      $lg={{
        bottom: 62,
      }}
      $sm={{
        bottom: 80,
      }}
      $xs={{
        right: 10,
        left: 10,
      }}
    >
      <Flex row p="$spacing8" borderRadius="$rounded20" height="100%">
        <Flex
          centered
          m="$spacing12"
          mr="$spacing6"
          height={45}
          width={45}
          backgroundColor={theme.warning2}
          borderRadius="$rounded12"
        >
          <Globe size={28} color={theme.warning} />
        </Flex>
        <Flex gap="$spacing2" p={10} $xs={{ maxWidth: 270 }} flexShrink={1}>
          <Text variant="body2" color={theme.neutral1}>
            <Trans i18nKey="outageBanner.title" values={{ versionName }} />
          </Text>
          <Text variant="body3" color={theme.neutral2}>
            <Trans i18nKey="outageBanner.message" values={{ chainName, versionDescription }} />
          </Text>
          <Text variant="body3" color={theme.neutral2}>
            <Trans i18nKey="outageBanner.message.sub" />
          </Text>
          <ExternalLink href="https://support.uniswap.org/hc/en-us/articles/23952001935373-Subgraph-downtime">
            <Text variant="body3" color={theme.accent1}>
              <Trans i18nKey="common.button.learn" />
            </Text>
          </ExternalLink>
        </Flex>
        <OutageCloseButton
          data-testid="uniswap-outage-banner"
          onClick={() => {
            setHidden(true)
            sessionStorage.setItem(getOutageBannerSessionStorageKey(chainId), 'true')
          }}
        />
      </Flex>
    </Flex>
  )
}
