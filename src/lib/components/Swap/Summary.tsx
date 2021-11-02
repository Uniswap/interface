import { useAtomValue } from 'jotai/utils'
import styled, { icon } from 'lib/theme'
import TYPE from 'lib/theme/type'
import { useMemo, useState } from 'react'
import { ArrowRight, Info } from 'react-feather'

import Action, { Approval } from '../Action'
import Column from '../Column'
import { Footer, Header } from '../Dialog'
import Row from '../Row'
import Rule from '../Rule'
import Details from './Details'
import { Input, inputAtom, outputAtom, swapAtom } from './state'

const ArrowIcon = icon(ArrowRight)
const InfoIcon = icon(Info)

const TokenImg = styled.img`
  border-radius: 100%;
  height: 1em;
  width: 1em;
`

function InputSummary({ token, value, usdc, change }: Required<Input> & { change?: number }) {
  const percent = useMemo(() => {
    if (change === undefined) {
      return undefined
    }
    const percent = (change * 100).toPrecision(3)
    return change > 0 ? ` (+${percent}%)` : `(${percent}%)`
  }, [change])
  return (
    <Column gap={0.5}>
      <Row gap={0.5} justify="flex-start">
        <TokenImg src={token.logoURI} />
        {value} {token.symbol}
      </Row>
      <Row justify="flex-start">
        <TYPE.caption color="secondary">~ {usdc && `$${usdc.toLocaleString('en')}`}</TYPE.caption>
        {change && <TYPE.caption color={change < 0 ? 'error' : 'success'}>&emsp;{percent}</TYPE.caption>}
      </Row>
    </Column>
  )
}

export function SummaryDialog() {
  const { swap } = useAtomValue(swapAtom)
  const input = useAtomValue(inputAtom)
  const output = useAtomValue(outputAtom)

  const price = useMemo(() => {
    if (!(input.value && output.value)) {
      return 0
    }
    return output.value / input.value
  }, [output.value, input.value])
  const [confirmedPrice, confirmPrice] = useState(price)

  const change = useMemo(() => {
    if (input.usdc && output.usdc) {
      return output.usdc / input.usdc - 1
    }
    return undefined
  }, [input.usdc, output.usdc])

  if (!(input.token && input.value && input.usdc && output.token && output.value && output.usdc && swap)) {
    return null
  }

  return (
    <>
      <Header title="Swap summary" ruled />
      <Column gap={1} padded scrollable>
        <Column gap={1} flex>
          <TYPE.body2>
            <Row gap={1}>
              <InputSummary token={input.token} value={input.value} usdc={input.usdc} />
              <ArrowIcon />
              <InputSummary token={output.token} value={output.value} usdc={output.usdc} change={change} />
            </Row>
          </TYPE.body2>
          <TYPE.caption>
            1 {input.token.symbol} = {price} {output.token.symbol}
          </TYPE.caption>
        </Column>
        <Rule />
        <Column gap={0.75}>
          <Row justify="flex-start" gap={0.5}>
            <InfoIcon />
            <TYPE.subhead2 color="secondary">Transaction details</TYPE.subhead2>
          </Row>
          <Details />
        </Column>
        <Rule />
        <TYPE.caption color="secondary">
          Output is estimated.
          {swap.minimumReceived &&
            `You will receive at least ${swap.minimumReceived} ${output.token.symbol} or the transaction
          will revert.`}
          {swap.maximumSent &&
            `You will send at most ${swap.maximumSent} ${input.token.symbol} or the transaction will revert.`}
        </TYPE.caption>
      </Column>
      <Footer>
        {price === confirmedPrice ? (
          <Action color="active" onClick={() => void 0}>
            Confirm
          </Action>
        ) : (
          <Approval color="active" onClick={() => confirmPrice(price)}>
            Price updated
          </Approval>
        )}
      </Footer>
    </>
  )
}
