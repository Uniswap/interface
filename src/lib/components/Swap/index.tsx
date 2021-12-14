import { Trans } from '@lingui/macro'
import { useActiveWeb3React } from 'hooks/web3'
import { useState } from 'react'
import { useValue } from 'react-cosmos-shared2/FixtureLoader'

import Header from '../Header'
import { BoundaryProvider } from '../Popover'
import Wallet from '../Wallet'
import Widget, { WidgetProps } from '../Widget'
import Input from './Input'
import Output from './Output'
import ReverseButton from './ReverseButton'
import Settings from './Settings'
import SwapButton from './SwapButton'
import Toolbar from './Toolbar'

type SwapWidgetProps = Omit<WidgetProps, 'children'>

export default function Swap(props: SwapWidgetProps) {
  const ctx = useActiveWeb3React()
  console.log('Swap.ctx', ctx)
  const [boundary, setBoundary] = useState<HTMLDivElement | null>(null)
  const [jsonRpcConnection] = useValue('json rpc provided', { defaultValue: false })
  const [walletConnection] = useValue('wallet connected', { defaultValue: true })
  const disabled = !jsonRpcConnection && !walletConnection
  return (
    <Widget {...props}>
      <Header logo title={<Trans>Swap</Trans>}>
        {!disabled && <Wallet disabled={!walletConnection} />}
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
    </Widget>
  )
}
