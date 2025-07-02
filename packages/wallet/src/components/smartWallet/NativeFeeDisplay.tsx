import { Flex } from 'ui/src'
import { NetworkFeeDisplay } from 'wallet/src/components/smartWallet/NetworkFeeDisplay'
import { GroupedGasFee } from 'wallet/src/features/smartWallet/utils/gasFeeUtils'

interface NativeFeeDisplayProps {
  groupedFees: Record<string, GroupedGasFee> | null
}

export function NativeFeeDisplay({ groupedFees }: NativeFeeDisplayProps): JSX.Element | null {
  if (!groupedFees) {
    return null
  }
  return (
    <Flex gap="$spacing4">
      {Object.entries(groupedFees).map(([symbol, groupedFee]) => (
        <NetworkFeeDisplay key={symbol} symbol={symbol} groupedFee={groupedFee} />
      ))}
    </Flex>
  )
}
