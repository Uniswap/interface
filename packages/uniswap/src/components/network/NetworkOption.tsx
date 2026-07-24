import { isWebPlatform } from '@universe/environment'
import { type ReactNode, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ElementAfterText, Flex, FlexProps, Text } from 'ui/src'
import { CheckmarkCircle } from 'ui/src/components/icons/CheckmarkCircle'
import { iconSizes } from 'ui/src/theme'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { NetworkPile } from 'uniswap/src/components/network/NetworkPile/NetworkPile'
import { NewTag } from 'uniswap/src/components/pill/NewTag'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

const NETWORK_OPTION_ICON_SIZE = iconSizes.icon24
const OPTION_GAP = isWebPlatform ? '$spacing8' : '$spacing6'
const BACKGROUND_COLOR = '$surface2'

export function NetworkOption({
  chainId,
  chainIds,
  currentlySelected,
  isNew,
  borderRadius = '$rounded8',
  trailingElement,
  forceAllNetworksLabel,
}: {
  chainId: UniverseChainId | null
  chainIds?: UniverseChainId[]
  currentlySelected?: boolean
  isNew: boolean
  borderRadius?: FlexProps['borderRadius']
  trailingElement?: ReactNode
  forceAllNetworksLabel?: boolean
}): JSX.Element {
  const { t } = useTranslation()
  const info = chainId && getChainInfo(chainId)

  const content = useMemo(
    () =>
      !info?.label ? (
        <Flex row gap="$spacing12" alignItems="center">
          {chainIds?.length ? (
            <NetworkPile chainIds={chainIds} size="small" />
          ) : (
            <NetworkLogo chainId={null} size={NETWORK_OPTION_ICON_SIZE} />
          )}
          <Text color="$neutral1" variant="body2">
            {chainIds?.length && !forceAllNetworksLabel
              ? t('explore.tokens.table.networks', { count: chainIds.length })
              : t('transaction.network.all')}
          </Text>
        </Flex>
      ) : (
        <Flex row gap="$spacing12">
          <NetworkLogo chainId={chainId} size={NETWORK_OPTION_ICON_SIZE} />
          <ElementAfterText
            element={isNew ? <NewTag ml={OPTION_GAP} /> : undefined}
            text={info.label}
            textProps={{ color: '$neutral1', variant: 'body2' }}
          />
        </Flex>
      ),
    [chainId, chainIds, info?.label, isNew, t, forceAllNetworksLabel],
  )

  return (
    <Flex
      row
      alignItems="center"
      justifyContent="space-between"
      px="$spacing8"
      py={10}
      hoverStyle={{ backgroundColor: BACKGROUND_COLOR, borderRadius }}
    >
      {content}
      <Flex centered height={NETWORK_OPTION_ICON_SIZE} width={NETWORK_OPTION_ICON_SIZE}>
        {trailingElement ??
          (currentlySelected && <CheckmarkCircle color="$neutral1" ml={OPTION_GAP} size="$icon.20" />)}
      </Flex>
    </Flex>
  )
}
