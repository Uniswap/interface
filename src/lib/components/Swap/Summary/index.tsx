import { Trans } from '@lingui/macro'
import { useAtomValue } from 'jotai/utils'
import { IconButton } from 'lib/components/Button'
import { ChevronDown, ChevronUp, Info } from 'lib/icons'
import styled, { ThemedText } from 'lib/theme'
import { useMemo, useState } from 'react'

import ActionButton from '../../ActionButton'
import Column from '../../Column'
import { Header } from '../../Dialog'
import Row from '../../Row'
import Rule from '../../Rule'
import { Input, inputAtom, outputAtom, swapAtom } from '../state'
import Details from './Details'
import Summary from './Summary'

export default Summary

function asInput(input: Input): (Required<Pick<Input, 'token' | 'value'>> & Input) | undefined {
  return input.token && input.value ? (input as Required<Pick<Input, 'token' | 'value'>>) : undefined
}

const updated = { message: <Trans>Price updated</Trans>, action: <Trans>Accept</Trans> }

const SummaryColumn = styled(Column)`
  height: calc(100% - 2.5em);
`

interface SummaryDialogProps {
  onConfirm: () => void
}

export function SummaryDialog({ onConfirm }: SummaryDialogProps) {
  const swap = useAtomValue(swapAtom)
  const partialInput = useAtomValue(inputAtom)
  const partialOutput = useAtomValue(outputAtom)
  const input = asInput(partialInput)
  const output = asInput(partialOutput)

  const price = useMemo(() => {
    return input && output ? output.value / input.value : undefined
  }, [input, output])
  const [confirmedPrice, confirmPrice] = useState(price)

  const [open, setOpen] = useState(true)

  if (!(input && output && swap)) {
    return null
  }

  return (
    <>
      <Header title={<Trans>Swap summary</Trans>} ruled />
      <SummaryColumn gap={0.75} padded>
        <Column gap={0.75} flex>
          <Summary input={input} output={output} usdc={true} />
          <ThemedText.Caption>
            1 {input.token.symbol} = {price} {output.token.symbol}
          </ThemedText.Caption>
        </Column>
        <Rule />
        <Row>
          <Row gap={0.5}>
            <Info color="secondary" />
            <ThemedText.Subhead2 color="secondary">
              <Trans>Swap details</Trans>
            </ThemedText.Subhead2>
          </Row>
          <IconButton color="secondary" onClick={() => setOpen(!open)} icon={open ? ChevronDown : ChevronUp} />
        </Row>
        <Column gap={0.75}>
          <Details input={input.token} output={output.token} swap={swap} />
        </Column>
        <Rule />
        {!open && (
          <ThemedText.Caption color="secondary">
            <Trans>Output is estimated.</Trans>{' '}
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
          </ThemedText.Caption>
        )}
        <ActionButton
          onClick={onConfirm}
          onUpdate={() => confirmPrice(price)}
          updated={price === confirmedPrice ? undefined : updated}
        >
          <Trans>Confirm swap</Trans>
        </ActionButton>
      </SummaryColumn>
    </>
  )
}
