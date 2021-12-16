import { Trans } from '@lingui/macro'
import { useState } from 'react'

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
  const [boundary, setBoundary] = useState<HTMLDivElement | null>(null)
  const { jsonRpcEndpoint } = props
  const disabled = !jsonRpcEndpoint
  return (
    <Widget {...props}>
      <Header logo title={<Trans>Swap</Trans>}>
        {!disabled && <Wallet disabled={disabled} />}
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
