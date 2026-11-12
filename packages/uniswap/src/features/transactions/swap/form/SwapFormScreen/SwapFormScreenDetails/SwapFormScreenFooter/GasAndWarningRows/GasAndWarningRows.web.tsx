import { toScreenInput, useIsBlockedAddress } from '@universe/compliance'
import { isWebApp } from '@universe/environment'
import { Flex, Text, TouchableArea } from '@universe/mycelium'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { useActiveAddress } from 'uniswap/src/features/accounts/store/hooks'
import { InsufficientNativeTokenWarning } from 'uniswap/src/features/transactions/components/InsufficientNativeTokenWarning/InsufficientNativeTokenWarning'
import { BlockedAddressWarning } from 'uniswap/src/features/transactions/modals/BlockedAddressWarning'
import { TradeInfoRow } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormScreenDetails/SwapFormScreenFooter/GasAndWarningRows/TradeInfoRow/TradeInfoRow'
import { useCanonicalBridgeChainId } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormScreenDetails/SwapFormScreenFooter/GasAndWarningRows/useCanonicalBridgeChainId'
import { useDebouncedGasInfo } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormScreenDetails/SwapFormScreenFooter/GasAndWarningRows/useDebouncedGasInfo'
import { useResetGasCta } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormScreenDetails/SwapFormScreenFooter/GasAndWarningRows/useResetGasCta'
import { useParsedSwapWarnings } from 'uniswap/src/features/transactions/swap/hooks/useSwapWarnings/useSwapWarnings'
import { useSwapFormStoreDerivedSwapInfo } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'

export const GasAndWarningRows = memo(function GasAndWarningRows(): JSX.Element {
  const { t } = useTranslation()
  const chainId = useSwapFormStoreDerivedSwapInfo((s) => s.chainId)
  const address = useActiveAddress(chainId)

  // Same as useIsSwapButtonDisabled: web fills this entry on the Review press, the
  // extension still screens at render.
  const { isBlocked } = useIsBlockedAddress(toScreenInput(address, chainId), { enabled: !isWebApp })

  const { formScreenWarning, warnings } = useParsedSwapWarnings()
  const inlineWarning =
    formScreenWarning && formScreenWarning.displayedInline && !isBlocked ? formScreenWarning.warning : undefined
  const bridgeChainId = useCanonicalBridgeChainId(inlineWarning)

  const debouncedGasInfo = useDebouncedGasInfo()
  const { showResetGas, onResetGas } = useResetGasCta(inlineWarning)

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
            address={address}
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

        <Flex gap="$spacing8" px="$spacing8" py="$spacing4">
          <TradeInfoRow bridgeChainId={bridgeChainId} gasInfo={debouncedGasInfo} warning={inlineWarning} />
          {showResetGas && (
            <TouchableArea testID="gas-info-row-reset-gas" onPress={onResetGas}>
              <Text color="$accent1" variant="body3">
                {t('common.button.resetGas')}
              </Text>
            </TouchableArea>
          )}
        </Flex>

        <InsufficientNativeTokenWarning flow="swap" gasFee={debouncedGasInfo.gasFee} warnings={warnings} />
      </Flex>
    </>
  )
})
