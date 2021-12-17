import { Trans } from '@lingui/macro'
import { useAtomValue } from 'jotai/utils'
import { AlertTriangle, Info, largeIconCss, Spinner } from 'lib/icons'
import styled, { ThemedText, ThemeProvider } from 'lib/theme'
import { useMemo, useState } from 'react'

import { TextButton } from '../Button'
import Row from '../Row'
import Rule from '../Rule'
import Tooltip from '../Tooltip'
import { Field, Input, inputAtom, outputAtom, stateAtom, swapAtom } from './state'

const mockBalance = 123.45

function RoutingTooltip() {
  return (
    <Tooltip icon={Info} placement="bottom">
      <ThemeProvider>
        <ThemedText.Subhead2>TODO: Routing Tooltip</ThemedText.Subhead2>
      </ThemeProvider>
    </Tooltip>
  )
}

type FilledInput = Input & Required<Pick<Input, 'token' | 'value'>>

function asFilledInput(input: Input): FilledInput | undefined {
  return input.token && input.value ? (input as FilledInput) : undefined
}

interface LoadedStateProps {
  input: FilledInput
  output: FilledInput
}

function LoadedState({ input, output }: LoadedStateProps) {
  const [flip, setFlip] = useState(true)
  const ratio = useMemo(() => {
    const [a, b] = flip ? [output, input] : [input, output]
    const ratio = `1 ${a.token.symbol} = ${b.value / a.value} ${b.token.symbol}`
    const usdc = a.usdc && ` ($${(a.usdc / a.value).toLocaleString('en')})`
    return (
      <Row gap={0.25} style={{ userSelect: 'text' }}>
        {ratio}
        {usdc && <ThemedText.Caption color="secondary">{usdc}</ThemedText.Caption>}
      </Row>
    )
  }, [flip, input, output])

  return (
    <TextButton color="primary" onClick={() => setFlip(!flip)}>
      {ratio}
    </TextButton>
  )
}

const ToolbarRow = styled(Row)`
  padding: 0.5em 0;
  ${largeIconCss}
`

export default function Toolbar({ disabled }: { disabled?: boolean }) {
  const { activeInput } = useAtomValue(stateAtom)
  const swap = useAtomValue(swapAtom)
  const input = useAtomValue(inputAtom)
  const output = useAtomValue(outputAtom)
  const balance = mockBalance

  const caption = useMemo(() => {
    const filledInput = asFilledInput(input)
    const filledOutput = asFilledInput(output)
    if (disabled) {
      return (
        <>
          <AlertTriangle color="secondary" />
          <Trans>Connect wallet to swap</Trans>
        </>
      )
    }
    if (activeInput === Field.INPUT ? filledInput && output.token : filledOutput && input.token) {
      if (!swap) {
        return (
          <>
            <Spinner color="secondary" />
            <Trans>Fetching best price…</Trans>
          </>
        )
      }
      if (filledInput && filledInput.value > balance) {
        return (
          <>
            <AlertTriangle color="secondary" />
            <Trans>Insufficient {filledInput.token.symbol}</Trans>
          </>
        )
      }
      if (filledInput && filledOutput) {
        return (
          <>
            <RoutingTooltip />
            <LoadedState input={filledInput} output={filledOutput} />
          </>
        )
      }
    }
    return (
      <>
        <Info color="secondary" />
        <Trans>Enter an amount</Trans>
      </>
    )
  }, [activeInput, balance, disabled, input, output, swap])

  return (
    <>
      <Rule />
      <ThemedText.Caption>
        <ToolbarRow justify="flex-start" gap={0.5} iconSize={4 / 3}>
          {caption}
        </ToolbarRow>
      </ThemedText.Caption>
    </>
  )
}
