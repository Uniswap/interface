import { default as React } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Separator, Text, useSporeColors } from 'ui/src'
import Check from 'ui/src/assets/icons/check.svg'
import { iconSizes } from 'ui/src/theme'
import { NetworkLogo } from 'wallet/src/components/CurrencyLogo/NetworkLogo'
import { ChainId, CHAIN_INFO } from 'wallet/src/constants/chains'

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
  return (
    <>
      <Separator />
      <Flex row alignItems="center" justifyContent="space-between" px="$spacing24" py="$spacing16">
        {(chainId && <NetworkLogo chainId={chainId} size={NETWORK_OPTION_ICON_SIZE} />) || (
          <Flex width={NETWORK_OPTION_ICON_SIZE} />
        )}
        <Text color="$neutral1" variant="body1">
          {info?.label ?? t('All networks')}
        </Text>
        <Flex centered height={NETWORK_OPTION_ICON_SIZE} width={NETWORK_OPTION_ICON_SIZE}>
          {currentlySelected && (
            <Check
              color={colors.neutral1.get()}
              height={iconSizes.icon20}
              width={iconSizes.icon20}
            />
          )}
        </Flex>
      </Flex>
    </>
  )
}
