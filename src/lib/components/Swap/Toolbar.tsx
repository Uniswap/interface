import { Trans } from '@lingui/macro'
import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { ALL_SUPPORTED_CHAIN_IDS } from 'constants/chains'
import useUSDCPrice from 'hooks/useUSDCPrice'
import { useAtomValue } from 'jotai/utils'
import { useSwapInfo } from 'lib/hooks/swap'
import useActiveWeb3React from 'lib/hooks/useActiveWeb3React'
import { AlertTriangle, Info, largeIconCss, Spinner } from 'lib/icons'
import { Field, independentFieldAtom } from 'lib/state/swap'
import styled, { ThemedText } from 'lib/theme'
import { useMemo, useState } from 'react'
import { InterfaceTrade } from 'state/routing/types'

import { TextButton } from '../Button'
import Row from '../Row'
import Rule from '../Rule'

const ToolbarRow = styled(Row)`
  padding: 0.5em 0;
  ${largeIconCss}
`

function RoutingTooltip() {
  return <Info color="secondary" />
  /* TODO(zzmp): Implement post-beta launch.
  return (
    <Tooltip icon={Info} placement="bottom">
      <ThemeProvider>
        <ThemedText.Subhead2>TODO: Routing Tooltip</ThemedText.Subhead2>
      </ThemeProvider>
    </Tooltip>
  )
  */
}

interface LoadedStateProps {
  inputAmount: CurrencyAmount<Currency>
  outputAmount: CurrencyAmount<Currency>
  trade: InterfaceTrade<Currency, Currency, TradeType> | undefined
}

function LoadedState({ inputAmount, outputAmount, trade }: LoadedStateProps) {
  const [flip, setFlip] = useState(true)
  const executionPrice = trade?.executionPrice
  const fiatValueInput = useUSDCPrice(inputAmount.currency)
  const fiatValueOutput = useUSDCPrice(outputAmount.currency)

  const ratio = useMemo(() => {
    const [a, b] = flip ? [outputAmount, inputAmount] : [inputAmount, outputAmount]

    const ratio = `1 ${a.currency.symbol} = ${executionPrice?.toSignificant(6)} ${b.currency.symbol}`
    const usdc = !flip
      ? fiatValueInput
        ? ` ($${fiatValueInput.toSignificant(2)})`
        : null
      : fiatValueOutput
      ? ` ($${fiatValueOutput.toSignificant(2)})`
      : null

    return (
      <Row gap={0.25} style={{ userSelect: 'text' }}>
        {ratio}
        {usdc && <ThemedText.Caption color="secondary">{usdc}</ThemedText.Caption>}
      </Row>
    )
  }, [executionPrice, fiatValueInput, fiatValueOutput, flip, inputAmount, outputAmount])

  return (
    <TextButton color="primary" onClick={() => setFlip(!flip)}>
      {ratio}
    </TextButton>
  )
}

export default function Toolbar({ disabled }: { disabled?: boolean }) {
  const { chainId } = useActiveWeb3React()
  const {
    trade,
    currencies: { [Field.INPUT]: inputCurrency, [Field.OUTPUT]: outputCurency },
    currencyBalances: { [Field.INPUT]: balance },
    currencyAmounts: { [Field.INPUT]: inputAmount, [Field.OUTPUT]: outputAmount },
  } = useSwapInfo()
  const independentField = useAtomValue(independentFieldAtom)

  const caption = useMemo(() => {
    if (disabled) {
      return (
        <>
          <AlertTriangle color="secondary" />
          <Trans>Connect wallet to swap</Trans>
        </>
      )
    }

    if (chainId && !ALL_SUPPORTED_CHAIN_IDS.includes(chainId)) {
      return (
        <>
          <AlertTriangle color="secondary" />
          <Trans>Unsupported network&#8211;switch to another to trade.</Trans>
        </>
      )
    }

    if (independentField === Field.INPUT ? inputCurrency && inputAmount : outputCurency && outputAmount) {
      if (!trade?.trade) {
        return (
          <>
            <Spinner color="secondary" />
            <Trans>Fetching best price…</Trans>
          </>
        )
      }
      if (inputAmount && balance && inputAmount.greaterThan(balance)) {
        return (
          <>
            <AlertTriangle color="secondary" />
            <Trans>Insufficient {inputCurrency?.symbol}</Trans>
          </>
        )
      }
      if (inputCurrency && inputAmount && outputCurency && outputAmount) {
        return (
          <>
            <RoutingTooltip />
            <LoadedState inputAmount={inputAmount} outputAmount={outputAmount} trade={trade?.trade} />
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
  }, [
    balance,
    chainId,
    disabled,
    independentField,
    inputAmount,
    inputCurrency,
    outputAmount,
    outputCurency,
    trade?.trade,
  ])

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
