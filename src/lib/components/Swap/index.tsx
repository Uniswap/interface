import { useState } from 'react'

import Header from '../Header'
import { BoundaryProvider } from '../Popover'
import Wallet from '../Wallet'
import Action from './Action'
import Input from './Input'
import Output from './Output'
import Reverse from './Reverse'
import Settings from './Settings'
import Toolbar from './Toolbar'

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
          <Input>
            <Reverse />
          </Input>
          <Output>
            <Toolbar />
            <Action />
          </Output>
        </BoundaryProvider>
      </div>
    </>
  )
}
