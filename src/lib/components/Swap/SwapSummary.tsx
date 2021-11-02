import { useAtomValue } from 'jotai/utils'
import styled, { icon } from 'lib/theme'
import TYPE from 'lib/theme/type'
import { Token } from 'lib/types'
import { useMemo, useState } from 'react'
import { ArrowRight } from 'react-feather'

import Action, { Approval } from '../Action'
import Column from '../Column'
import { Header } from '../Dialog'
import Row from '../Row'
import Rule from '../Rule'
import { inputAtom, outputAtom, swapAtom } from './state'

const ArrowIcon = icon(ArrowRight)

const TokenImg = styled.img`
  border-radius: 100%;
  height: 1em;
  width: 1em;
`

interface TokenSummaryProps {
  token: Token
  value: number
  usdc?: number
  change?: number
}

function TokenSummary({ token, value, usdc, change }: TokenSummaryProps) {
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

export function SwapSummaryDialog() {
  const swap = useAtomValue(swapAtom)
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
    if (swap.output && swap.input) {
      return swap.output.usdc / swap.input.usdc - 1
    }
    return undefined
  }, [swap.input, swap.output])

  if (!(input.token && input.value && output.token && output.value)) {
    return null
  }

  return (
    <>
      <Header title="Swap summary" ruled />
      <Column gap={1} padded scrollable>
        <Column gap={1} flex>
          <TYPE.body2>
            <Row gap={1}>
              <TokenSummary token={input.token} value={input.value} usdc={swap.input?.usdc} />
              <ArrowIcon />
              <TokenSummary token={output.token} value={output.value} usdc={swap.output?.usdc} change={change} />
            </Row>
          </TYPE.body2>
          <TYPE.caption>
            1 {input.token.symbol} = {price} {output.token.symbol}
          </TYPE.caption>
        </Column>
        <Rule />
        <Rule />
        <TYPE.caption color="secondary">
          Output is estimated. You will receive at least {swap.minimumReceived} {input.token.symbol} or the transaction
          will revert.
        </TYPE.caption>
        {price === confirmedPrice ? (
          <Action color="active" onClick={() => void 0}>
            Confirm
          </Action>
        ) : (
          <Approval color="active" onClick={() => confirmPrice(price)}>
            Price updated
          </Approval>
        )}
      </Column>
    </>
  )
}
