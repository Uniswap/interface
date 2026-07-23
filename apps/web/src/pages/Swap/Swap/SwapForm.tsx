import { Flex } from 'ui/src'
import { useGetPasskeyAuthStatus } from 'uniswap/src/features/passkey/hooks/useGetPasskeyAuthStatus'
import type { SwapRedirectFn } from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext'
import { SwapFormSettings } from 'uniswap/src/features/transactions/swap/components/SwapFormSettings/SwapFormSettings'
import { SwapOffHoursBanner } from 'uniswap/src/features/transactions/swap/components/SwapOffHoursBanner/SwapOffHoursBanner'
import { SwapDependenciesStoreContextProvider } from 'uniswap/src/features/transactions/swap/stores/swapDependenciesStore/SwapDependenciesStoreContextProvider'
import type { SwapFormState } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/types'
import { SwapFlow } from 'uniswap/src/features/transactions/swap/SwapFlow/SwapFlow'
import { noop } from 'utilities/src/react/noop'
import { useSwapHandlers } from '~/features/Swap/hooks/useSwapHandlers/useSwapHandlers'
import type { CurrencyState } from '~/features/Swap/state/types'
import { SwapBottomCard } from '~/features/Swap/SwapBottomCard'
import { useAccount } from '~/hooks/useAccount'
import { PageType, useIsPage } from '~/hooks/useIsPage'
import { useResetOverrideOneClickSwapFlag } from '~/pages/Swap/Swap/settings/OneClickSwap'
import { useWebSwapSettings } from '~/pages/Swap/Swap/settings/useWebSwapSettings'

export interface SwapFormProps {
  hideHeader?: boolean
  hideFooter?: boolean
  prefilledState?: SwapFormState
  onCurrencyChange?: (selected: CurrencyState, isBridgePair?: boolean) => void
  swapRedirectCallback?: SwapRedirectFn
  tokenColor?: string
  onCurrencyPanelsLayout?: (height: number) => void
}

export function SwapFormSettingsButton(): JSX.Element {
  const swapSettings = useWebSwapSettings()

  return (
    <SwapFormSettings
      settings={swapSettings}
      position="relative"
      adjustTopAlignment={false}
      adjustRightAlignment={false}
    />
  )
}

export function SwapForm({
  hideHeader = false,
  hideFooter = false,
  prefilledState,
  onCurrencyChange,
  swapRedirectCallback,
  tokenColor,
  onCurrencyPanelsLayout,
}: SwapFormProps): JSX.Element {
  const swapHandlers = useSwapHandlers()
  const swapSettings = useWebSwapSettings()
  const resetDisableOneClickSwap = useResetOverrideOneClickSwapFlag()

  const connectorId = useAccount().connector?.id
  const passkeyAuthStatus = useGetPasskeyAuthStatus(connectorId)

  // Only show on the dedicated Swap screen; the TDP renders its own off-hours banner above the swap widget.
  const isSwapPage = useIsPage(PageType.SWAP)

  return (
    <Flex gap="$spacing16">
      <SwapDependenciesStoreContextProvider swapHandlers={swapHandlers}>
        <SwapFlow
          settings={swapSettings}
          hideHeader={hideHeader}
          hideFooter={hideFooter}
          onClose={noop}
          swapRedirectCallback={swapRedirectCallback}
          onCurrencyChange={onCurrencyChange}
          prefilledState={prefilledState}
          tokenColor={tokenColor}
          onSubmitSwap={resetDisableOneClickSwap}
          passkeyAuthStatus={passkeyAuthStatus}
          onCurrencyPanelsLayout={onCurrencyPanelsLayout}
        />
      </SwapDependenciesStoreContextProvider>
      {isSwapPage && <SwapOffHoursBanner />}
      <SwapBottomCard />
    </Flex>
  )
}
