import { isWebApp } from '@universe/environment'
import { Flex, Text } from 'ui/src'
import { Gas } from 'ui/src/components/icons/Gas'
import { SponsoredFee, SponsoredFeeWithModal, UniswapXFee } from 'uniswap/src/components/gas/NetworkFee'
import { NetworkFeeWarning } from 'uniswap/src/components/gas/NetworkFeeWarning'
import type { GasInfo } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormScreenDetails/SwapFormScreenFooter/GasAndWarningRows/types'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { isZero } from 'uniswap/src/utils/number'

function NetworkFeeWarningContent({ gasInfo }: { gasInfo?: GasInfo }): JSX.Element | null {
  const sponsorMetadata = gasInfo?.sponsorshipInfo?.sponsorMetadata
  if (sponsorMetadata) {
    return <SponsoredFee sponsorMetadata={sponsorMetadata} preSavingsGasFee={gasInfo.fiatPriceFormatted} />
  }

  if (!gasInfo?.fiatPriceFormatted) {
    return null
  }

  const color = gasInfo.isHighRelativeToValue && !isWebApp ? '$statusCritical' : '$neutral2' // Avoid high gas UI on interface
  const uniswapXSavings = gasInfo.uniswapXGasFeeInfo?.preSavingsGasFeeFormatted
  const isGasFeeFree = gasInfo.gasFee.value !== undefined && isZero(gasInfo.gasFee.value)

  return uniswapXSavings ? (
    <UniswapXFee gasFee={gasInfo.fiatPriceFormatted} isFree={isGasFeeFree} preSavingsGasFee={uniswapXSavings} />
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
  const { sponsorMetadata, campaign } = gasInfo.sponsorshipInfo ?? {}

  if (!sponsorMetadata && !gasInfo.fiatPriceFormatted) {
    return null
  }

  if (sponsorMetadata && campaign) {
    return (
      <Flex
        centered
        row
        animation="quick"
        enterStyle={{ opacity: 0 }}
        opacity={hidden ? 0 : gasInfo.isLoading ? 0.6 : 1}
        testID={TestID.GasInfoRow}
      >
        <SponsoredFeeWithModal
          sponsorMetadata={sponsorMetadata}
          campaign={campaign}
          preSavingsGasFee={gasInfo.fiatPriceFormatted}
        />
      </Flex>
    )
  }

  return (
    <Flex centered row animation="quick" enterStyle={{ opacity: 0 }} opacity={hidden ? 0 : gasInfo.isLoading ? 0.6 : 1}>
      <NetworkFeeWarning
        gasFeeHighRelativeToValue={gasInfo.isHighRelativeToValue}
        placement={isWebApp ? 'top' : 'bottom'}
        tooltipTrigger={
          <Flex centered row gap="$spacing4" testID={TestID.GasInfoRow}>
            <NetworkFeeWarningContent gasInfo={hidden ? undefined : gasInfo} />
          </Flex>
        }
        disabled={hidden}
        uniswapXGasFeeInfo={gasInfo.uniswapXGasFeeInfo}
        chainId={gasInfo.chainId}
      />
    </Flex>
  )
}
