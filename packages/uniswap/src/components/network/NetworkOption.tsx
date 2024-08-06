import { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text, useSporeColors } from 'ui/src'
import { CheckmarkCircle } from 'ui/src/components/icons/CheckmarkCircle'
import { iconSizes } from 'ui/src/theme'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { UNIVERSE_CHAIN_INFO } from 'uniswap/src/constants/chains'
import { UniverseChainId } from 'uniswap/src/types/chains'

const NETWORK_OPTION_ICON_SIZE = iconSizes.icon24

export function NetworkOption({
  chainId,
  currentlySelected,
}: {
  chainId: UniverseChainId | null
  currentlySelected?: boolean
}): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const info = chainId && UNIVERSE_CHAIN_INFO[chainId]

  let content: ReactNode = null

  if (!info?.label) {
    content = (
      <Flex row gap="$spacing12">
        <NetworkLogo chainId={null} size={NETWORK_OPTION_ICON_SIZE} />
        <Text color="$neutral1" variant="body2">
          {t('transaction.network.all')}
        </Text>
      </Flex>
    )
  } else {
    content = (
      <Flex row gap="$spacing12">
        {(chainId && <NetworkLogo chainId={chainId} size={NETWORK_OPTION_ICON_SIZE} />) || (
          <Flex width={NETWORK_OPTION_ICON_SIZE} />
        )}
        <Text color="$neutral1" variant="body2">
          {info.label}
        </Text>
      </Flex>
    )
  }

  return (
    <Flex row alignItems="center" justifyContent="space-between" px="$spacing8" py={10}>
      {content}
      <Flex centered height={NETWORK_OPTION_ICON_SIZE} width={NETWORK_OPTION_ICON_SIZE}>
        {currentlySelected && <CheckmarkCircle color={colors.neutral1.get()} size={iconSizes.icon20} />}
      </Flex>
    </Flex>
  )
}
