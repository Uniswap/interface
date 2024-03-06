import { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Icons, Text, useSporeColors } from 'ui/src'
import Check from 'ui/src/assets/icons/check.svg'
import { iconSizes } from 'ui/src/theme'
import { NetworkLogo } from 'wallet/src/components/CurrencyLogo/NetworkLogo'
import { CHAIN_INFO, ChainId } from 'wallet/src/constants/chains'

const NETWORK_OPTION_ICON_SIZE = iconSizes.icon24

export function NetworkOption({
  chainId,
  currentlySelected,
}: {
  chainId: ChainId | null
  currentlySelected?: boolean
}): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const info = chainId && CHAIN_INFO[chainId]

  let content: ReactNode = null

  if (!info?.label) {
    content = (
      <Flex row gap="$spacing12">
        <Flex
          centered
          backgroundColor="$neutral3"
          borderRadius={6}
          height={NETWORK_OPTION_ICON_SIZE}
          width={NETWORK_OPTION_ICON_SIZE}>
          <Icons.Ellipsis color={colors.sporeWhite.val} size="$icon.16" />
        </Flex>
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
        {currentlySelected && (
          <Check color={colors.neutral1.get()} height={iconSizes.icon20} width={iconSizes.icon20} />
        )}
      </Flex>
    </Flex>
  )
}
