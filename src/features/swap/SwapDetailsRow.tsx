import React from 'react'
import { StyleSheet } from 'react-native'
import InfoCircle from 'src/assets/icons/info-circle.svg'
import { Button } from 'src/components/buttons/Button'
import { Box } from 'src/components/layout/Box'
import { Text } from 'src/components/Text'
import { Trade } from 'src/features/swap/types'
import { formatExecutionPrice } from 'src/features/swap/utils'
import { formatPrice } from 'src/utils/format'

interface SwapDetailRowProps {
  trade: Trade | undefined | null
  label: string
}

export function SwapDetailRow(props: SwapDetailRowProps) {
  const { label, trade } = props

  return (
    <Box flexDirection="row" justifyContent="space-between" alignSelf="stretch" alignItems="center">
      <Box flexDirection="row" justifyContent="center" alignItems="center">
        <InfoCircle height={20} width={20} />
        <Text variant="bodySm" fontWeight="500" ml="sm" color="gray400">
          {label || formatExecutionPrice(trade?.executionPrice)}
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
            <Text style={styles.gasButtonLabel} p="xs">
              {formatPrice(trade.quote?.gasUseEstimateUSD?.toString())}
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
