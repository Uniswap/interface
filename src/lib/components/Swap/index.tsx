import { Trans } from '@lingui/macro'
import { TokenInfo } from '@uniswap/token-lists'
import { SupportedLocale } from 'constants/locales'
import { nativeOnChain } from 'constants/tokens'
import { useSwapAmount, useSwapCurrency } from 'lib/hooks/swap'
import { SwapInfoUpdater } from 'lib/hooks/swap/useSwapInfo'
import useActiveWeb3React from 'lib/hooks/useActiveWeb3React'
import useTokenList from 'lib/hooks/useTokenList'
import { Field } from 'lib/state/swap'
import { Theme } from 'lib/theme'
import { useLayoutEffect, useState } from 'react'
import { Provider as EthProvider } from 'widgets-web3-react/types'

import { ErrorHandler } from '../Error/ErrorBoundary'
import Header from '../Header'
import { BoundaryProvider } from '../Popover'
import Wallet from '../Wallet'
import Input from './Input'
import Output from './Output'
import ReverseButton from './ReverseButton'
import Settings from './Settings'
import SwapButton from './SwapButton'
import Toolbar from './Toolbar'

export interface SwapProps {
  theme?: Theme
  locale?: SupportedLocale
  provider?: EthProvider
  jsonRpcEndpoint?: string
  width?: string | number
  dialog?: HTMLElement | null
  className?: string
  onError?: ErrorHandler
  tokenList?: string | TokenInfo[]
  defaultInputAddress?: string | { [chainId: number]: string }
  defaultInputAmount?: number
  defaultOutputAddress?: string | { [chainId: number]: string }
  defaultOutputAmount?: number
  convenienceFee?: number
  convenienceFeeRecipient?: string | { [chainId: number]: string }
}

export default function Swap(props: SwapProps) {
  const { tokenList } = props

  useTokenList(tokenList)

  const { active, account, chainId } = useActiveWeb3React()
  const [lastChainId, setLastChainId] = useState<number | undefined>(chainId)
  const [boundary, setBoundary] = useState<HTMLDivElement | null>(null)

  // Switch to on-chain currencies if/when chain changes to prevent chain mismatched currencies.
  const [, updateSwapInputCurrency] = useSwapCurrency(Field.INPUT)
  const [, updateSwapOutputCurrency] = useSwapCurrency(Field.OUTPUT)
  const [, updateSwapInputAmount] = useSwapAmount(Field.INPUT)

  useLayoutEffect(() => {
    if (chainId !== lastChainId) {
      setLastChainId(chainId)
      if (chainId) {
        updateSwapInputCurrency(nativeOnChain(chainId))
        updateSwapOutputCurrency()
        updateSwapInputAmount('')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chainId])

  return (
    <>
      <SwapInfoUpdater />
      <Header logo title={<Trans>Swap</Trans>}>
        {active && <Wallet disabled={!account} />}
        <Settings disabled={!active} />
      </Header>
      <div ref={setBoundary}>
        <BoundaryProvider value={boundary}>
          <Input disabled={!active} />
          <ReverseButton disabled={!active} />
          <Output disabled={!active}>
            <Toolbar disabled={!active} />
            <SwapButton />
          </Output>
        </BoundaryProvider>
      </div>
    </>
  )
}
