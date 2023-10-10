import { useSwapTxAndGasInfo } from 'src/features/transactions/swap/hooks'
import { DerivedSwapInfo } from 'src/features/transactions/swap/types'
import { Flex, Icons, Text, useSporeColors } from 'ui/src'
import { formatUSDPrice, NumberType } from 'utilities/src/format/format'
import { useUSDValue } from 'wallet/src/features/gas/hooks'

type GasFeeProps = {
  derivedSwapInfo: DerivedSwapInfo
}

export const GasFee = ({ derivedSwapInfo }: GasFeeProps): JSX.Element | null => {
  const { chainId } = derivedSwapInfo
  const colors = useSporeColors()

  const { gasFee } = useSwapTxAndGasInfo(
    derivedSwapInfo,
    // TODO: skip this query when we implement review screen
    false
  )
  const gasFeeUSD = useUSDValue(chainId, gasFee.value ?? undefined)

  return gasFeeUSD ? (
    <Flex centered row gap="$spacing4" padding="$spacing16">
      <Icons.Gas color={colors.neutral2.val} size="$icon.20" />
      <Text color="$neutral2" variant="body3">
        {formatUSDPrice(gasFeeUSD, NumberType.FiatGasPrice)}
      </Text>
    </Flex>
  ) : null
}
