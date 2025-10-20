import { Flex } from 'ui/src'
import { WarningLabel } from 'uniswap/src/components/modals/WarningModal/types'
import { isSVMChain } from 'uniswap/src/features/platforms/utils/chains'
import { InsufficientNativeTokenWarning } from 'uniswap/src/features/transactions/components/InsufficientNativeTokenWarning/InsufficientNativeTokenWarning'
import { BlockedAddressWarning } from 'uniswap/src/features/transactions/modals/BlockedAddressWarning'
import { TradeInfoRow } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormScreenDetails/SwapFormScreenFooter/GasAndWarningRows/TradeInfoRow/TradeInfoRow'
import { useDebouncedGasInfo } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormScreenDetails/SwapFormScreenFooter/GasAndWarningRows/useDebouncedGasInfo'
import { useParsedSwapWarnings } from 'uniswap/src/features/transactions/swap/hooks/useSwapWarnings/useSwapWarnings'
import { useSwapFormStoreDerivedSwapInfo } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { useIsBlocked } from 'uniswap/src/features/trm/hooks'
import { useWallet } from 'uniswap/src/features/wallet/hooks/useWallet'

export function GasAndWarningRows(): JSX.Element {
  const chainId = useSwapFormStoreDerivedSwapInfo((s) => s.chainId)
  const wallet = useWallet()
  const address = isSVMChain(chainId) ? wallet.svmAccount?.address : wallet.evmAccount?.address

  const { isBlocked } = useIsBlocked(address)

  const { formScreenWarning, warnings } = useParsedSwapWarnings()
  const inlineWarning =
    formScreenWarning && formScreenWarning.displayedInline && !isBlocked ? formScreenWarning.warning : undefined

  const debouncedGasInfo = useDebouncedGasInfo()

  const insufficientGasFundsWarning = warnings.find((w) => {
    return w.type === WarningLabel.InsufficientFunds
  })

  return (
    <>
      {/*
        Do not add any margins directly to this container, as this component is used in 2 different places.
        Adjust the margin in the parent component instead.
      */}
      <Flex gap="$spacing12">
        {isBlocked && (
          // TODO: review design of this warning.
          <BlockedAddressWarning
            row
            alignItems="center"
            alignSelf="stretch"
            backgroundColor="$surface2"
            borderBottomLeftRadius="$rounded16"
            borderBottomRightRadius="$rounded16"
            flexGrow={1}
            px="$spacing16"
            py="$spacing12"
          />
        )}

        {!insufficientGasFundsWarning && (
          <Flex gap="$spacing8" px="$spacing8" py="$spacing4">
            <TradeInfoRow gasInfo={debouncedGasInfo} warning={inlineWarning} />
          </Flex>
        )}

        <InsufficientNativeTokenWarning flow="swap" gasFee={debouncedGasInfo.gasFee} warnings={warnings} />
      </Flex>
    </>
  )
}
