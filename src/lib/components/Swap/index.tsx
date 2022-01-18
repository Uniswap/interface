import { Trans } from '@lingui/macro'
import { TokenInfo } from '@uniswap/token-lists'
import useActiveWeb3React from 'lib/hooks/useActiveWeb3React'
import useTokenList, { DEFAULT_TOKEN_LIST } from 'lib/hooks/useTokenList'
import { useMemo, useState } from 'react'

import Header from '../Header'
import { BoundaryProvider } from '../Popover'
import Wallet from '../Wallet'
import Input from './Input'
import Output from './Output'
import ReverseButton from './ReverseButton'
import Settings from './Settings'
import SwapButton from './SwapButton'
import Toolbar from './Toolbar'

interface DefaultTokenAmount {
  address?: string | { [chainId: number]: string }
  amount?: number
}

interface SwapDefaults {
  tokenList: string | TokenInfo[]
  input: DefaultTokenAmount
  output: DefaultTokenAmount
}

const DEFAULT_INPUT: DefaultTokenAmount = { address: 'ETH' }
const DEFAULT_OUTPUT: DefaultTokenAmount = {}

function useSwapDefaults(defaults: Partial<SwapDefaults> = {}): SwapDefaults {
  const tokenList = defaults.tokenList || DEFAULT_TOKEN_LIST
  const input: DefaultTokenAmount = defaults.input || DEFAULT_INPUT
  const output: DefaultTokenAmount = defaults.output || DEFAULT_OUTPUT
  input.amount = input.amount || 0
  output.amount = output.amount || 0
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => ({ tokenList, input, output }), [])
}

export interface SwapProps {
  defaults?: Partial<SwapDefaults>
}

export default function Swap({ defaults }: SwapProps) {
  const { tokenList } = useSwapDefaults(defaults)
  useTokenList(tokenList)

  const [boundary, setBoundary] = useState<HTMLDivElement | null>(null)
  const { active, account } = useActiveWeb3React()
  return (
    <>
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
