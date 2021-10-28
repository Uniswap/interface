import { useAtom } from 'jotai'
import { useCallback, useState } from 'react'

import Header from '../Header'
import { BoundaryProvider } from '../Popover'
import Wallet from '../Wallet'
import Settings from './Settings'
import { inputAtom, outputAtom } from './state'
import SwapAction from './SwapAction'
import SwapInput from './SwapInput'
import SwapOutput from './SwapOutput'
import SwapReverse from './SwapReverse'
import SwapToolbar from './SwapToolbar'

export default function Swap() {
  const [input, setInput] = useAtom(inputAtom)
  const [output, setOutput] = useAtom(outputAtom)
  const onReverse = useCallback(() => {
    setInput(output)
    setOutput(input)
  }, [input, output, setInput, setOutput])

  const [boundary, setBoundary] = useState<HTMLDivElement | null>(null)

  return (
    <>
      <Header logo title="Swap">
        <Wallet />
        <Settings />
      </Header>
      <div ref={setBoundary}>
        <BoundaryProvider value={boundary}>
          <SwapInput>
            <SwapReverse onClick={onReverse} />
          </SwapInput>
          <SwapOutput>
            <SwapToolbar />
            <SwapAction />
          </SwapOutput>
        </BoundaryProvider>
      </div>
    </>
  )
}
