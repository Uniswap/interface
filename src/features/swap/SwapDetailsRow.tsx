import React from 'react'
import InfoCircle from 'src/assets/icons/info-circle.svg'
import { Button } from 'src/components/buttons/Button'
import { NetworkLogo } from 'src/components/CurrencyLogo/NetworkLogo'
import { Flex } from 'src/components/layout'
import { Box } from 'src/components/layout/Box'
import { Text } from 'src/components/Text'
import { ChainId } from 'src/constants/chains'
import { Trade } from 'src/features/swap/useTrade'
import { formatExecutionPrice } from 'src/features/swap/utils'
import { useNetworkColors } from 'src/utils/colors'
import { formatPrice } from 'src/utils/format'

interface SwapDetailRowProps {
  trade: Trade | undefined | null
  label: string | null
}

export function SwapDetailRow(props: SwapDetailRowProps) {
  const { label, trade } = props

  const chainId = trade?.inputAmount.currency.chainId ?? ChainId.MAINNET
  const networkColors = useNetworkColors(chainId)

  return (
    <Box alignItems="center" alignSelf="stretch" flexDirection="row" justifyContent="space-between">
      <Box alignItems="center" flexDirection="row" justifyContent="center">
        <InfoCircle height={20} width={20} />
        <Text color="gray400" fontWeight="500" ml="sm" variant="bodySm">
          {label || formatExecutionPrice(trade?.executionPrice)}
        </Text>
      </Box>
      {trade && (
        <Button
          borderRadius="sm"
          style={{ backgroundColor: networkColors.background }}
          onPress={() => {
            // TODO: implement gas price setting ui
          }}>
          <Flex centered flexDirection="row" gap="xxs" m="sm">
            <NetworkLogo chainId={trade.inputAmount.wrapped.currency.chainId} size={15} />
            <Text style={{ color: networkColors.foreground }}>
              {formatPrice(trade.quote?.gasUseEstimateUSD?.toString())}
            </Text>
          </Flex>
        </Button>
      )}
    </Box>
  )
}
