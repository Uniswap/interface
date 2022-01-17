import { Trans } from '@lingui/macro'
import { Token } from '@uniswap/sdk-core'
import { TokenInfo } from '@uniswap/token-lists'
import { nativeOnChain } from 'constants/tokens'
import { useUpdateAtom } from 'jotai/utils'
import useActiveWeb3React from 'lib/hooks/useActiveWeb3React'
import useTokenList, { DEFAULT_TOKEN_LIST, useTokenMap } from 'lib/hooks/useTokenList'
import { Field, stateAtom } from 'lib/state/swap'
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
  defaults?: Partial<SwapDefaults>
}

export default function Swap({ defaults: userDefaults }: SwapProps) {
  const defaults = useSwapDefaults(userDefaults)

  useTokenList(defaults.tokenList)

  const [lastChainId, setLastChainId] = useState<number | null>(null)
  const { active, account, chainId } = useActiveWeb3React()
  const setState = useUpdateAtom(stateAtom)
  const tokenMap = useTokenMap()
  useLayoutEffect(() => {
    if (chainId && chainId !== lastChainId) {
      setLastChainId(chainId)

      const input = getToken(defaults.input.address) ?? nativeOnChain(chainId)
      const output = getToken(defaults.output.address)
      setState({
        activeInput: Field.INPUT,
        input: { token: input, value: defaults.input.amount },
        output: { token: output, value: defaults.output.amount },
      })
    }

    function getToken(address?: string | { [chainId: number]: string }): Token | undefined {
      if (!chainId) return undefined
      const addr = typeof address === 'object' ? address[chainId] : address
      return addr ? tokenMap[addr] : undefined
    }
  }, [
    chainId,
    defaults.input.address,
    defaults.input.amount,
    defaults.output.address,
    defaults.output.amount,
    lastChainId,
    setState,
    tokenMap,
  ])

  const [boundary, setBoundary] = useState<HTMLDivElement | null>(null)
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
