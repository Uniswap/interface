import React from 'react'
import { SlideInDown, SlideOutUp } from 'react-native-reanimated'
import { useAppSelector, useAppTheme } from 'src/app/hooks'
import FlashbotsIcon from 'src/assets/icons/flashbots.svg'
import InfoCircle from 'src/assets/icons/info-circle.svg'
import { Button } from 'src/components/buttons/Button'
import { NetworkLogo } from 'src/components/CurrencyLogo/NetworkLogo'
import { AnimatedBox, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { ChainId } from 'src/constants/chains'
import { isFlashbotsSupportedChainId } from 'src/features/providers/flashbotsProvider'
import { ElementName, SectionName } from 'src/features/telemetry/constants'
import { Trace } from 'src/features/telemetry/Trace'
import { Trade } from 'src/features/transactions/swap/useTrade'
import { formatExecutionPrice } from 'src/features/transactions/swap/utils'
import { selectFlashbotsEnabled } from 'src/features/wallet/selectors'
import { useNetworkColors } from 'src/utils/colors'
import { formatPrice } from 'src/utils/format'

interface QuickDetailsProps {
  trade: Trade | undefined | null
  label: string | null
}

export function QuickDetails(props: QuickDetailsProps) {
  const { label, trade } = props

  const chainId = trade?.inputAmount.currency.chainId ?? ChainId.Mainnet
  const networkColors = useNetworkColors(chainId)

  const theme = useAppTheme()

  const flashbotsEnabled = useAppSelector(selectFlashbotsEnabled)
  const willUseFlashbots =
    flashbotsEnabled && isFlashbotsSupportedChainId(trade?.inputAmount.currency.chainId)

  return (
    <Trace logImpression section={SectionName.QuickDetails}>
      <AnimatedBox
        alignItems="center"
        alignSelf="stretch"
        entering={SlideInDown}
        exiting={SlideOutUp}
        flexDirection="row"
        justifyContent="space-between">
        <Flex centered row gap="xs">
          {willUseFlashbots ? (
            <FlashbotsIcon
              color={label ? theme.colors.deprecated_gray400 : theme.colors.mainForeground}
              height={20}
              width={20}
            />
          ) : (
            <InfoCircle
              color={label ? theme.colors.deprecated_gray400 : theme.colors.mainForeground}
              height={20}
              width={20}
            />
          )}
          <Text
            color={label ? 'deprecated_gray400' : 'mainForeground'}
            fontWeight="500"
            variant="body2">
            {label || formatExecutionPrice(trade?.executionPrice)}
          </Text>
        </Flex>
        {trade && (
          <Button
            borderRadius="sm"
            name={ElementName.NetworkButton}
            style={{ backgroundColor: networkColors.background }}
            onPress={() => {
              // TODO: implement gas price setting ui
            }}>
            <Flex centered flexDirection="row" gap="xs" m="sm">
              <NetworkLogo chainId={trade.inputAmount.wrapped.currency.chainId} size={15} />
              <Text style={{ color: networkColors.foreground }} variant="body2">
                {formatPrice(trade.quote?.gasUseEstimateUSD?.toString())}
              </Text>
            </Flex>
          </Button>
        )}
      </AnimatedBox>
    </Trace>
  )
}
