import React from 'react'
import { StyleSheet } from 'react-native'
import InfoCircle from 'src/assets/icons/info-circle.svg'
import { Button } from 'src/components/buttons/Button'
import { Box } from 'src/components/layout/Box'
import { Text } from 'src/components/Text'
import { QuoteResult } from 'src/features/swap/types'

interface SwapDetailRowProps {
  trade: QuoteResult | undefined
  label: string
}

export function SwapDetailRow(props: SwapDetailRowProps) {
  const { label, trade } = props

  return (
    <Box flexDirection="row" justifyContent="space-between" alignSelf="stretch" alignItems="center">
      <Box flexDirection="row" justifyContent="center" alignItems="center">
        <InfoCircle height={20} width={20} />
        <Text variant="body" fontWeight="500" ml="sm">
          {/* TODO: get actual execution price */}
          {label || '1 DAI = 0.000004 ETH ($1)'}
        </Text>
      </Box>
      {trade && (
        <Box flexDirection="row">
          <Button
            borderRadius="xs"
            p="xs"
            style={styles.gasButton}
            onPress={() => {
              // TODO: implement gas price setting ui
            }}>
            {/*TODO(#175): better price formatting utils  */}
            <Text style={styles.gasButtonLabel} p="xs">
              ${parseFloat(trade.gasUseEstimateUSD).toFixed(2)}
            </Text>
          </Button>
        </Box>
      )}
    </Box>
  )
}

const styles = StyleSheet.create({
  gasButton: {
    backgroundColor: 'rgba(164, 87, 255, 0.05)',
  },
  gasButtonLabel: {
    color: '#A457FF',
  },
  swapArrowContainer: {},
})
