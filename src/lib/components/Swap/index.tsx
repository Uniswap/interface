import { Trans } from '@lingui/macro'
import { TokenInfo } from '@uniswap/token-lists'
import { nativeOnChain } from 'constants/tokens'
import { useSwapAmount, useSwapCurrency } from 'lib/hooks/swap'
import { SwapInfoUpdater } from 'lib/hooks/swap/useSwapInfo'
import useActiveWeb3React from 'lib/hooks/useActiveWeb3React'
import useTokenList, { DEFAULT_TOKEN_LIST } from 'lib/hooks/useTokenList'
import { Field } from 'lib/state/swap'
import { useLayoutEffect, useMemo, useState } from 'react'

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

function useSwapDefaults(defaults: Partial<SwapDefaults> = {}): SwapDefaults {
  const tokenList = defaults.tokenList || DEFAULT_TOKEN_LIST
  const input: DefaultTokenAmount = defaults.input || {}
  const output: DefaultTokenAmount = defaults.output || {}
  input.amount = input.amount || 0
  output.amount = output.amount || 0
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => ({ tokenList, input, output }), [])
}

export interface SwapProps {
  convenienceFee?: number
  convenienceFeeRecipient?: string // TODO: improve typing to require recipient when fee is set
  defaults?: Partial<SwapDefaults>
}

export default function Swap({ defaults: userDefaults }: SwapProps) {
  const defaults = useSwapDefaults(userDefaults)

  useTokenList(defaults.tokenList)

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
