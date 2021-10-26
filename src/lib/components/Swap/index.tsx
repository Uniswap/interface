import { atom, useAtom } from 'jotai'
import useColor, { prefetchColor } from 'lib/hooks/useColor'
import { ETH } from 'lib/mocks'
import { Token } from 'lib/types'
import { useCallback, useState } from 'react'

import Header from '../Header'
import { BoundaryProvider } from '../Popover'
import Wallet from '../Wallet'
import Settings from './Settings'
import SwapAction from './SwapAction'
import SwapInput from './SwapInput'
import SwapOutput from './SwapOutput'
import SwapReverse from './SwapReverse'
import SwapToolbar from './SwapToolbar'

const inputValueAtom = atom<number | undefined>(undefined)
const inputTokenAtom = atom<Token | undefined>(ETH)
const outputValueAtom = atom<number | undefined>(undefined)
const outputTokenAtom = atom<Token | undefined>(undefined)

export default function Swap() {
  const [transition, setTransition] = useState(false)

  const [inputValue, setInputValue] = useAtom(inputValueAtom)
  const [inputToken, setInputToken] = useAtom(inputTokenAtom)
  const [outputValue, setOutputValue] = useAtom(outputValueAtom)
  const [outputToken, setOutputToken] = useAtom(outputTokenAtom)
  const input = {
    value: inputValue,
    token: inputToken,
    onChangeValue: setInputValue,
    onChangeToken: setInputToken,
  }
  const output = {
    value: outputValue,
    token: outputToken,
    onChangeValue: setOutputValue,
    onChangeToken: (token: Token) => (setTransition(false), setOutputToken(token)),
  }
  const onReverse = useCallback(() => {
    setInputValue(outputValue)
    setInputToken(outputToken)
    setOutputValue(inputValue)
    setOutputToken(inputToken)
    setTransition(true)
  }, [setInputValue, outputValue, setInputToken, outputToken, setOutputValue, inputValue, setOutputToken, inputToken])

  const [boundary, setBoundary] = useState<HTMLDivElement | null>(null)
  prefetchColor(inputToken) // extract eagerly in case of reversal
  const color = useColor(outputToken)

  return (
    <>
      <Header logo title="Swap">
        <Wallet />
        <Settings />
      </Header>
      <div ref={setBoundary}>
        <BoundaryProvider value={boundary}>
          <SwapInput {...input}>
            <SwapReverse onClick={onReverse} />
          </SwapInput>
          <SwapOutput color={color} transition={transition} {...output}>
            <SwapToolbar />
            <SwapAction />
          </SwapOutput>
        </BoundaryProvider>
      </div>
    </>
  )
}
