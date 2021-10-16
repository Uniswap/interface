import { useState } from 'react'

import Header from '../Header'
import { BoundaryProvider } from '../Popover'
import Widget from '../Widget'
import Settings from './Settings'
import SwapStateProvider from './state'

export default function Swap() {
  const [boundary, setBoundary] = useState<HTMLDivElement | null>(null)
  return (
    <Widget>
      <SwapStateProvider>
        <Header logo title="Swap">
          <Settings />
        </Header>
        <div ref={setBoundary}>
          <BoundaryProvider value={boundary}></BoundaryProvider>
        </div>
      </SwapStateProvider>
    </Widget>
  )
}
