import { Trans } from '@lingui/macro'
import { useAtomValue } from 'jotai/utils'
import styled, { icon } from 'lib/theme'
import TYPE from 'lib/theme/type'
import { useMemo, useState } from 'react'
import { ArrowRight, Info } from 'react-feather'

import ActionButton, { ApprovalButton } from '../ActionButton'
import Column from '../Column'
import { Header } from '../Dialog'
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

const SummaryColumn = styled(Column)`
  margin-bottom: 0.75em;
  padding-bottom: 0;
`

interface SummaryProps {
  input: Required<Pick<Input, 'token' | 'value'>> & Input
  output: Required<Pick<Input, 'token' | 'value'>> & Input
}

export default function Summary({ input, output }: SummaryProps) {
  const change = useMemo(() => {
    if (input.usdc && output.usdc) {
      return output.usdc / input.usdc - 1
    }
    return undefined
  }, [input.usdc, output.usdc])
  const percent = useMemo(() => {
    if (change === undefined) {
      return undefined
    }
    const percent = (change * 100).toPrecision(3)
    return change > 0 ? `(+${percent}%)` : `(${percent}%)`
  }, [change])

  return (
    <TYPE.body2>
      <Row gap={1}>
        <Column gap={0.25}>
          <Row gap={0.5} justify="flex-start">
            <TokenImg src={input.token.logoURI} />
            {input.value} {input.token.symbol}
          </Row>
          {input.usdc && (
            <Row justify="flex-start">
              <TYPE.caption color="secondary">~ {input.usdc && `$${input.usdc.toLocaleString('en')}`}</TYPE.caption>
            </Row>
          )}
        </Column>
        <ArrowIcon />
        <Column gap={0.25}>
          <Row gap={0.5} justify="flex-start">
            <TokenImg src={output.token.logoURI} />
            {output.value} {output.token.symbol}
          </Row>
          {output.usdc && (
            <Row justify="flex-start">
              <TYPE.caption color="secondary">~ {output.usdc && `$${output.usdc.toLocaleString('en')}`}</TYPE.caption>
              {change && <TYPE.caption color={change < 0 ? 'error' : 'success'}>&emsp;{percent}</TYPE.caption>}
            </Row>
          )}
        </Column>
      </Row>
    </TYPE.body2>
  )
}

function asInput(input: Input): (Required<Pick<Input, 'token' | 'value'>> & Input) | undefined {
  return input.token && input.value ? (input as Required<Pick<Input, 'token' | 'value'>>) : undefined
}

export function SummaryDialog() {
  const { swap } = useAtomValue(swapAtom)
  const partialInput = useAtomValue(inputAtom)
  const partialOutput = useAtomValue(outputAtom)
  const input = asInput(partialInput)
  const output = asInput(partialOutput)

  const price = useMemo(() => {
    return input && output ? output.value / input.value : undefined
  }, [input, output])
  const [confirmedPrice, confirmPrice] = useState(price)

  if (!(input && output)) {
    return null
  }

  return (
    <>
      <Header title={<Trans>Swap summary</Trans>} ruled />
      <SummaryColumn gap={0.75} padded scrollable>
        <Column gap={0.75} flex>
          <Summary input={input} output={output} />
          <TYPE.caption>
            1 {input.token.symbol} = {price} {output.token.symbol}
          </TYPE.caption>
        </Column>
        <Rule />
        <Column gap={0.75}>
          <Row justify="flex-start" gap={0.5}>
            <InfoIcon />
            <TYPE.subhead2 color="secondary">
              <Trans>Transaction details</Trans>
            </TYPE.subhead2>
          </Row>
          <Details />
        </Column>
        <Rule />
        <TYPE.caption color="secondary">
          <Trans>Output is estimated.</Trans>
          {swap?.minimumReceived && (
            <Trans>
              You will receive at least {swap.minimumReceived} {output.token.symbol} or the transaction will revert.
            </Trans>
          )}
          {swap?.maximumSent && (
            <Trans>
              You will send at most {swap.maximumSent} {input.token.symbol} or the transaction will revert.
            </Trans>
          )}
        </TYPE.caption>
        {price === confirmedPrice ? (
          <ActionButton onClick={() => void 0}>
            <Trans>Confirm</Trans>
          </ActionButton>
        ) : (
          <ApprovalButton onClick={() => confirmPrice(price)}>
            <Trans>Price updated</Trans>
          </ApprovalButton>
        )}
      </SummaryColumn>
    </>
  )
}
