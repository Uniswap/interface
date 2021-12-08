import { Trans } from '@lingui/macro'
import { useAtomValue } from 'jotai/utils'
import { icon, ThemedText, ThemeProvider } from 'lib/theme'
import { useMemo, useState } from 'react'
import { AlertTriangle, Info } from 'react-feather'

import { TextButton } from '../Button'
import Row from '../Row'
import Rule from '../Rule'
import SpinnerIcon from '../SpinnerIcon'
import Tooltip from '../Tooltip'
import { Input, inputAtom, outputAtom, swapAtom } from './state'

const mockBalance = 123.45

const AlertIcon = icon(AlertTriangle)
const InfoIcon = icon(Info)

function RoutingTooltip() {
  return (
    <Tooltip icon={InfoIcon} placement="bottom">
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
    const [a, b] = flip ? [input, output] : [output, input]
    const ratio = `1 ${a.token.symbol} = ${b.value / a.value} ${b.token.symbol}`
    const usdc = a.usdc ? ` ($${(a.usdc / a.value).toLocaleString('en')})` : ''
    return ratio + usdc
  }, [flip, input, output])

  return (
    <TextButton color="primary" onClick={() => setFlip(!flip)}>
      {ratio}
    </TextButton>
  )
}

export default function Toolbar() {
  const swap = useAtomValue(swapAtom)
  const input = useAtomValue(inputAtom)
  const output = useAtomValue(outputAtom)
  const balance = mockBalance

  const caption = useMemo(() => {
    const filledInput = asFilledInput(input)
    const filledOutput = asFilledInput(output)
    if (filledInput && filledOutput) {
      if (!swap) {
        return (
          <>
            <SpinnerIcon color="primary" />
            <Trans>Fetching best price…</Trans>
          </>
        )
      } else if (filledInput.value > balance) {
        return (
          <>
            <AlertIcon />
            <Trans>Insufficient {filledInput.token.symbol}</Trans>
          </>
        )
      } else {
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
        <InfoIcon />
        <Trans>Enter an amount</Trans>
      </>
    )
  }, [balance, input, output, swap])

  return (
    <>
      <Rule />
      <ThemedText.Caption color="primary">
        <Row justify="flex-start" gap={0.5}>
          {caption}
        </Row>
      </ThemedText.Caption>
    </>
  )
}
