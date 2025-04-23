import { Flex, Text } from 'ui/src'
import { Gas } from 'ui/src/components/icons/Gas'
import { UniswapXFee } from 'uniswap/src/components/gas/NetworkFee'
import { NetworkFeeWarning } from 'uniswap/src/features/transactions/modals/NetworkFeeWarning'
import { GasInfo } from 'uniswap/src/features/transactions/swap/form/footer/types'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { isInterface } from 'utilities/src/platform'

function NetworkFeeWarningContent({ gasInfo }: { gasInfo: GasInfo }): JSX.Element | null {
  if (!gasInfo.fiatPriceFormatted) {
    return null
  }

  const color = gasInfo.isHighRelativeToValue && !isInterface ? '$statusCritical' : '$neutral2' // Avoid high gas UI on interface
  const uniswapXSavings = gasInfo.uniswapXGasFeeInfo?.preSavingsGasFeeFormatted

  return uniswapXSavings ? (
    <UniswapXFee gasFee={gasInfo.fiatPriceFormatted} preSavingsGasFee={uniswapXSavings} />
  ) : (
    <>
      <Gas color={color} size="$icon.16" />
      <Text color={color} variant="body3">
        {gasInfo.fiatPriceFormatted}
      </Text>
    </>
  )
}

export function GasInfoRow({ gasInfo, hidden }: { gasInfo: GasInfo; hidden?: boolean }): JSX.Element | null {
  if (!gasInfo.fiatPriceFormatted) {
    return null
  }

  return (
    <Flex centered row animation="quick" enterStyle={{ opacity: 0 }} opacity={hidden ? 0 : gasInfo.isLoading ? 0.6 : 1}>
      <NetworkFeeWarning
        gasFeeHighRelativeToValue={gasInfo.isHighRelativeToValue}
        placement={isInterface ? 'right' : 'bottom'}
        tooltipTrigger={
          <Flex centered row gap="$spacing4" testID={TestID.GasInfoRow}>
            <NetworkFeeWarningContent gasInfo={gasInfo} />
          </Flex>
        }
        uniswapXGasFeeInfo={gasInfo.uniswapXGasFeeInfo}
        chainId={gasInfo.chainId}
      />
    </Flex>
  )
}
