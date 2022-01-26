import { Trans } from '@lingui/macro'
import { TokenInfo } from '@uniswap/token-lists'
import useSwapDefaults from 'lib/hooks/swap/useSwapDefaults'
import { SwapInfoUpdater } from 'lib/hooks/swap/useSwapInfo'
import useActiveWeb3React from 'lib/hooks/useActiveWeb3React'
import useTokenList from 'lib/hooks/useTokenList'
import { useState } from 'react'

import Header from '../Header'
import { BoundaryProvider } from '../Popover'
import Wallet from '../Wallet'
import Input from './Input'
import Output from './Output'
import ReverseButton from './ReverseButton'
import Settings from './Settings'
import SwapButton from './SwapButton'
import SwapPropValidator from './SwapPropValidator'
import Toolbar from './Toolbar'

export type DefaultAddress = string | { [chainId: number]: string | 'NATIVE' } | 'NATIVE'
export interface SwapProps {
  tokenList?: string | TokenInfo[]
  defaultInputAddress?: DefaultAddress
  defaultInputAmount?: string
  defaultOutputAddress?: DefaultAddress
  defaultOutputAmount?: string
  convenienceFee?: number
  convenienceFeeRecipient?: string | { [chainId: number]: string }
}

export default function Swap(props: SwapProps) {
  useTokenList(props.tokenList)
  useSwapDefaults(props)

  const { active, account } = useActiveWeb3React()
  const [boundary, setBoundary] = useState<HTMLDivElement | null>(null)

  return (
    <SwapPropValidator {...props}>
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
            <SwapButton disabled={!account} />
          </Output>
        </BoundaryProvider>
      </div>
    </SwapPropValidator>
  )
}
