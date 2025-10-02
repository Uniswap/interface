import { Flex, Text } from 'ui/src'
import { Gas } from 'ui/src/components/icons/Gas'
import { UniswapXFee } from 'uniswap/src/components/gas/NetworkFee'
import { NetworkFeeWarning } from 'uniswap/src/components/gas/NetworkFeeWarning'
import type { GasInfo } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormScreenDetails/SwapFormScreenFooter/GasAndWarningRows/types'
import { usePriceUXEnabled } from 'uniswap/src/features/transactions/swap/hooks/usePriceUXEnabled'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { isWebApp } from 'utilities/src/platform'

function NetworkFeeWarningContent({ gasInfo }: { gasInfo?: GasInfo }): JSX.Element | null {
  const priceUXEnabled = usePriceUXEnabled()

  if (!gasInfo?.fiatPriceFormatted) {
    return null
  }

  const color =
    gasInfo.isHighRelativeToValue && !isWebApp
      ? '$statusCritical'
      : priceUXEnabled && gasInfo.isLoading
        ? '$neutral3'
        : '$neutral2' // Avoid high gas UI on interface
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
  const priceUXEnabled = usePriceUXEnabled()

  if (!gasInfo.fiatPriceFormatted) {
    return null
  }

  return (
    <Flex
      centered
      row
      animation="quick"
      enterStyle={{ opacity: 0 }}
      opacity={priceUXEnabled ? 1 : hidden ? 0 : gasInfo.isLoading ? 0.6 : 1}
    >
      <NetworkFeeWarning
        gasFeeHighRelativeToValue={gasInfo.isHighRelativeToValue}
        placement={isWebApp ? 'top' : 'bottom'}
        tooltipTrigger={
          <Flex centered row gap="$spacing4" testID={TestID.GasInfoRow}>
            <NetworkFeeWarningContent gasInfo={hidden ? undefined : gasInfo} />
          </Flex>
        }
        uniswapXGasFeeInfo={gasInfo.uniswapXGasFeeInfo}
        chainId={gasInfo.chainId}
      />
    </Flex>
  )
}
