import { Trans } from '@lingui/macro'
import { useState } from 'react'
import { useValue } from 'react-cosmos-shared2/FixtureLoader'

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
  const jsonRpcConnection = false
  const [walletConnection] = useValue('enabled', { defaultValue: false })
  const disabled = !jsonRpcConnection && !walletConnection
  return (
    <>
      <Header logo title={<Trans>Swap</Trans>}>
        {(jsonRpcConnection || walletConnection) && <Wallet />}
        <Settings disabled={disabled} />
      </Header>
      <div ref={setBoundary}>
        <BoundaryProvider value={boundary}>
          <Input disabled={disabled}>
            <ReverseButton disabled={disabled} />
          </Input>
          <Output disabled={disabled}>
            <Toolbar disabled={disabled} />
            <SwapButton />
          </Output>
        </BoundaryProvider>
      </div>
    </>
  )
}
