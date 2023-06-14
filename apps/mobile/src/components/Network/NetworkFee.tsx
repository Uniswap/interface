import React from 'react'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from 'src/app/hooks'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Box, Flex } from 'src/components/layout'
import { SpinningLoader } from 'src/components/loading/SpinningLoader'
import { InlineNetworkPill } from 'src/components/Network/NetworkPill'
import { Text } from 'src/components/Text'
import { useUSDValue } from 'src/features/gas/hooks'
import InfoCircleSVG from 'ui/src/assets/icons/info-circle.svg'
import { ChainId } from 'wallet/src/constants/chains'
import { formatUSDPrice, NumberType } from 'wallet/src/utils/format'

export function NetworkFee({
  chainId,
  gasFee,
  gasFallbackUsed,
  onShowGasWarning,
}: {
  chainId: ChainId
  gasFee?: string
  gasFallbackUsed?: boolean
  onShowGasWarning?: () => void
}): JSX.Element {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const gasFeeUSD = useUSDValue(chainId, gasFee)

  const feeSectionContent = (
    <>
      <Text
        color={gasFallbackUsed && gasFeeUSD ? 'accentWarning' : 'textPrimary'}
        variant="subheadSmall">
        {formatUSDPrice(gasFeeUSD, NumberType.FiatGasPrice)}
      </Text>
      {gasFallbackUsed && gasFeeUSD && (
        <Box ml="spacing4">
          <InfoCircleSVG
            color={theme.colors.accentWarning}
            height={theme.iconSizes.icon20}
            width={theme.iconSizes.icon20}
          />
        </Box>
      )}
    </>
  )

  return (
    <Flex row alignItems="center" justifyContent="space-between">
      <Text variant="subheadSmall">{t('Network fee')}</Text>
      <Flex row alignItems="center" gap="spacing8">
        <InlineNetworkPill chainId={chainId} />
        <Text variant="subheadSmall">•</Text>
        {!gasFeeUSD ? (
          <SpinningLoader size={theme.iconSizes.icon20} />
        ) : gasFallbackUsed && onShowGasWarning ? (
          <TouchableArea
            alignItems="center"
            flexDirection="row"
            justifyContent="space-between"
            onPress={onShowGasWarning}>
            {feeSectionContent}
          </TouchableArea>
        ) : (
          <Flex row alignItems="center" justifyContent="space-between">
            {feeSectionContent}
          </Flex>
        )}
      </Flex>
    </Flex>
  )
}
