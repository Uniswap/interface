import { Trans } from '@lingui/macro'
import { TokenInfo } from '@uniswap/token-lists'
import { SupportedLocale } from 'constants/locales'
import useSwapDefaults from 'lib/hooks/swap/useSwapDefaults'
import { SwapInfoUpdater } from 'lib/hooks/swap/useSwapInfo'
import useActiveWeb3React from 'lib/hooks/useActiveWeb3React'
import useTokenList from 'lib/hooks/useTokenList'
import { Theme } from 'lib/theme'
import { useState } from 'react'
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

export type DefaultAddress = string | { [chainId: number]: string } | 'NATIVE'
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
  defaultInputAddress?: DefaultAddress
  defaultInputAmount?: string
  defaultOutputAddress?: DefaultAddress
  defaultOutputAmount?: string
  convenienceFee?: number
  convenienceFeeRecipient?: string | { [chainId: number]: string }
}

export default function Swap(props: SwapProps) {
  const { defaultInputAddress, defaultInputAmount, defaultOutputAddress, defaultOutputAmount, tokenList } = props

  useTokenList(tokenList)
  useSwapDefaults(defaultInputAddress, defaultInputAmount, defaultOutputAddress, defaultOutputAmount)

  const { active, account } = useActiveWeb3React()
  const [boundary, setBoundary] = useState<HTMLDivElement | null>(null)

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
