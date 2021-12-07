import { Trans } from '@lingui/macro'
import { useAtomValue } from 'jotai/utils'
import { icon, ThemedText, ThemeProvider } from 'lib/theme'
import { useMemo, useState } from 'react'
import { AlertTriangle, Info } from 'react-feather'

import { TextButton } from '../Button'
import Column from '../Column'
import Row from '../Row'
import Rule from '../Rule'
import SpinnerIcon from '../SpinnerIcon'
import Tooltip from '../Tooltip'
import Details from './Details'
import { Input, inputAtom, outputAtom, State, swapAtom } from './state'

const AlertIcon = icon(AlertTriangle)
const InfoIcon = icon(Info)

function DetailsTooltip() {
  return (
    <Tooltip icon={InfoIcon} placement="bottom">
      <ThemeProvider>
        <Column gap={0.75}>
          <ThemedText.Subhead2>
            <Trans>Transaction details</Trans>
          </ThemedText.Subhead2>
          <Rule />
          <Details />
        </Column>
      </ThemeProvider>
    </Tooltip>
  )
}

interface LoadedStateProps {
  input: Required<Input>
  output: Required<Input>
}

function LoadedState({ input, output }: LoadedStateProps) {
  const [flip, setFlip] = useState(true)
  const ratio = useMemo(() => {
    const [a, b] = flip ? [input, output] : [output, input]
    return `1 ${a.token.symbol} = ${b.value / a.value} ${b.token.symbol} ($${(a.usdc / a.value).toLocaleString('en')})`
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

  const caption = useMemo(() => {
    switch (swap.state) {
      case State.LOADING:
        return (
          <>
            <SpinnerIcon color="primary" />
            <Trans>Fetching best price…</Trans>
          </>
        )
      case State.BALANCE_INSUFFICIENT:
        return (
          <>
            <AlertIcon />
            <Trans>Insufficient {input.token?.symbol}</Trans>
          </>
        )
      case State.TOKEN_APPROVAL:
      // @ts-ignore
      // eslint-disable-next-line no-fallthrough
      case State.LOADED:
        if (input.value && input.token && input.usdc && output.value && output.token && output.usdc) {
          return (
            <>
              <DetailsTooltip />
              <LoadedState input={input as Required<Input>} output={output as Required<Input>} />
            </>
          )
        }
      // eslint-disable-next-line no-fallthrough
      default:
        return (
          <>
            <InfoIcon />
            <Trans>Enter an amount</Trans>
          </>
        )
    }
  }, [swap.state, input, output])

  return (
    <>
      <Rule />
      <ThemedText.Caption>
        <Row justify="flex-start" gap={0.5}>
          {caption}
        </Row>
      </ThemedText.Caption>
    </>
  )
}
