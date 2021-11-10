import { t } from '@lingui/macro'
import { useState } from 'react'

import Header from '../Header'
import { BoundaryProvider } from '../Popover'
import Wallet from '../Wallet'
import Input from './Input'
import Output from './Output'
import ReverseButton from './ReverseButton'
import Settings from './Settings'
import SwapButton from './SwapButton'
import Toolbar from './Toolbar'

export default function Swap() {
  const [boundary, setBoundary] = useState<HTMLDivElement | null>(null)
  return (
    <>
      <Header logo title={t`Swap`}>
        <Wallet />
        <Settings />
      </Header>
      <div ref={setBoundary}>
        <BoundaryProvider value={boundary}>
          <Input>
            <ReverseButton />
          </Input>
          <Output>
            <Toolbar />
            <SwapButton />
          </Output>
        </BoundaryProvider>
      </div>
    </>
  )
}
