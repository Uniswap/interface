import { Trans } from '@lingui/macro'
import { useAtomValue } from 'jotai/utils'
import { IconButton } from 'lib/components/Button'
import { ChevronDown, ChevronUp, Info } from 'lib/icons'
import styled, { ThemedText, useScrollbar } from 'lib/theme'
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

const SummaryColumn = styled(Column)``

const DetailsColumn = styled(Column)``

const Estimate = styled(ThemedText.Caption)`
  height: 0;
`

const Body = styled(Column)<{ open: boolean }>`
  height: calc(100% - 2.5em);

  ${SummaryColumn} {
    flex-grow: ${({ open }) => (open ? 0 : 1)};
    transition: flex-grow 0.2s;
  }

  ${DetailsColumn} {
    overflow-y: hidden;
    height: 1px;
    flex-grow: ${({ open }) => (open ? 1 : 0)};
    transition: flex-grow 0.2s;

    ${Column} {
      height: calc(100% - 2px);
      padding: ${({ open }) => (open ? '0.75em 0' : 0)};
      transition: padding 0.2s;
    }
  }

  ${Estimate} {
    flex-grow: ${({ open }) => (open ? 0 : 1)};
    height: ${({ open }) => open && 0};
    overflow-y: hidden;
    transition: flex-grow 0.2s;
  }
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

  const [details, setDetails] = useState<HTMLDivElement | null>(null)

  const scrollbar = useScrollbar(details)

  if (!(input && output && swap)) {
    return null
  }

  return (
    <>
      <Header title={<Trans>Swap summary</Trans>} ruled />
      <Body flex align="stretch" gap={0.75} padded open={open}>
        <SummaryColumn gap={0.75} flex justify="center">
          <Summary input={input} output={output} usdc={true} />
          <ThemedText.Caption>
            1 {input.token.symbol} = {price} {output.token.symbol}
          </ThemedText.Caption>
        </SummaryColumn>
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
        <DetailsColumn>
          <Rule scrollingEdge="bottom" />
          <Column gap={0.75} ref={setDetails} css={scrollbar}>
            <Details input={input.token} output={output.token} swap={swap} />
          </Column>
          <Rule />
        </DetailsColumn>
        <Estimate color="secondary">
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
        </Estimate>
        <ActionButton
          onClick={onConfirm}
          onUpdate={() => confirmPrice(price)}
          updated={price === confirmedPrice ? undefined : updated}
        >
          <Trans>Confirm swap</Trans>
        </ActionButton>
      </Body>
    </>
  )
}
