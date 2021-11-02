import { useState } from 'react'

import Header from '../Header'
import { BoundaryProvider } from '../Popover'
import Wallet from '../Wallet'
import Settings from './Settings'
import SwapAction from './SwapAction'
import SwapInput from './SwapInput'
import SwapOutput from './SwapOutput'
import SwapReverse from './SwapReverse'
import SwapToolbar from './SwapToolbar'

export default function Swap() {
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
            <SwapReverse />
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
