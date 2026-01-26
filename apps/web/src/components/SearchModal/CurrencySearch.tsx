import { Currency } from '@uniswap/sdk-core'
import { SwitchNetworkAction } from 'components/Popups/types'
import useSelectChain from 'hooks/useSelectChain'
import { useCallback, useEffect, useMemo } from 'react'
import { useMultichainContext } from 'state/multichain/useMultichainContext'
import { useSwapAndLimitContext } from 'state/swap/useSwapContext'
import { Flex } from 'ui/src'
import { TokenSelectorContent, TokenSelectorVariation } from 'uniswap/src/components/TokenSelector/TokenSelector'
import { TokenSelectorFlow } from 'uniswap/src/components/TokenSelector/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { InterfaceEventName, ModalName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { useWallet } from 'uniswap/src/features/wallet/hooks/useWallet'
import { CurrencyField } from 'uniswap/src/types/currency'
import { SwapTab } from 'uniswap/src/types/screens/interface'
import { usePrevious } from 'utilities/src/react/hooks'
import { showSwitchNetworkNotification } from 'utils/showSwitchNetworkNotification'

// HSKSwap 只支持 HashKey 主网和测试网
const HSKSWAP_ALLOWED_CHAIN_IDS = [UniverseChainId.HashKey, UniverseChainId.HashKeyTestnet]

interface CurrencySearchProps {
  currencyField: CurrencyField
  switchNetworkAction: SwitchNetworkAction
  onCurrencySelect: (currency: Currency) => void
  onDismiss: () => void
  chainIds?: UniverseChainId[]
  variation?: TokenSelectorVariation
}

export function CurrencySearch({
  currencyField,
  switchNetworkAction,
  onCurrencySelect,
  onDismiss,
  chainIds,
  variation,
}: CurrencySearchProps) {
  const wallet = useWallet()
  const { chainId, setSelectedChainId, isUserSelectedToken, setIsUserSelectedToken, isMultichainContext } =
    useMultichainContext()
  const { currentTab } = useSwapAndLimitContext()
  const prevChainId = usePrevious(chainId)

  const selectChain = useSelectChain()

  // 如果没有提供 chainIds，默认只使用 HashKey 主网和测试网
  const allowedChainIds = useMemo(() => {
    return chainIds ?? HSKSWAP_ALLOWED_CHAIN_IDS
  }, [chainIds])

  const handleCurrencySelectTokenSelectorCallback = useCallback(
    async ({ currency }: { currency: Currency }) => {
      if (!isMultichainContext) {
        const correctChain = await selectChain(currency.chainId)
        if (!correctChain) {
          return
        }
      }

      onCurrencySelect(currency)
      setSelectedChainId(currency.chainId)
      setIsUserSelectedToken(true)
      onDismiss()
    },
    [onCurrencySelect, onDismiss, setSelectedChainId, setIsUserSelectedToken, selectChain, isMultichainContext],
  )

  useEffect(() => {
    if ((currentTab !== SwapTab.Swap && currentTab !== SwapTab.Send) || !isMultichainContext) {
      return
    }

    showSwitchNetworkNotification({ chainId, prevChainId, action: switchNetworkAction })
  }, [currentTab, chainId, prevChainId, isMultichainContext, switchNetworkAction])

  return (
    <Trace logImpression eventOnTrigger={InterfaceEventName.TokenSelectorOpened} modal={ModalName.TokenSelectorWeb}>
      <Flex width="100%" flexGrow={1} flexShrink={1} flexBasis="auto">
        <TokenSelectorContent
          renderedInModal={false}
          evmAddress={wallet.evmAccount?.address}
          svmAddress={wallet.svmAccount?.address}
          isLimits={currentTab === SwapTab.Limit}
          chainId={!isMultichainContext || isUserSelectedToken ? chainId : undefined}
          chainIds={allowedChainIds}
          currencyField={currencyField}
          flow={TokenSelectorFlow.Swap}
          isSurfaceReady={true}
          variation={
            variation ??
            (currencyField === CurrencyField.INPUT
              ? TokenSelectorVariation.SwapInput
              : TokenSelectorVariation.SwapOutput)
          }
          onClose={onDismiss}
          onSelectCurrency={handleCurrencySelectTokenSelectorCallback}
        />
      </Flex>
    </Trace>
  )
}
