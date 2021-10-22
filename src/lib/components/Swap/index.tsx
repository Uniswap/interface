import styled from 'lib/theme'
import { useState } from 'react'

import Column from '../Column'
import Header from '../Header'
import { BoundaryProvider } from '../Popover'
import Wallet from '../Wallet'
import Settings from './Settings'
import SwapAction from './SwapAction'
import SwapInput from './SwapInput'
import SwapOutput from './SwapOutput'
import SwapReverse from './SwapReverse'
import SwapToolbar from './SwapToolbar'

const InputColumn = styled(Column)`
  padding: 0.75em;
  position: relative;
`

const OutputColumn = styled(InputColumn)`
  background-color: ${({ theme }) => theme.module};
  border-radius: ${({ theme }) => theme.borderRadius - 0.25}em;
`

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
          <InputColumn gap={0.75}>
            <SwapInput />
          </InputColumn>
          <OutputColumn gap={0.75}>
            <SwapReverse onClick={() => void 0} />
            <SwapOutput />
            <SwapToolbar />
            <SwapAction />
          </OutputColumn>
        </BoundaryProvider>
      </div>
    </>
  )
}
