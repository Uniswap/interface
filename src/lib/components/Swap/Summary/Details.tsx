import { t } from '@lingui/macro'
import { State } from 'lib/state/swap'
import { ThemedText } from 'lib/theme'
import { Token } from 'lib/types'
import { useMemo } from 'react'

import Row from '../../Row'

interface DetailProps {
  label: string
  value: string
}

function Detail({ label, value }: DetailProps) {
  return (
    <ThemedText.Caption>
      <Row gap={2}>
        <span>{label}</span>
        <span style={{ whiteSpace: 'nowrap' }}>{value}</span>
      </Row>
    </ThemedText.Caption>
  )
}

interface DetailsProps {
  swap: Required<State>['swap']
  input: Token
  output: Token
}

export default function Details({
  input: { symbol: inputSymbol },
  output: { symbol: outputSymbol },
  swap,
}: DetailsProps) {
  const integrator = window.location.hostname
  const details = useMemo((): [string, string][] => {
    return [
      [t`Liquidity provider fee`, `${swap.lpFee} ${inputSymbol}`],
      [t`${integrator} fee`, swap.integratorFee && `${swap.integratorFee} ${inputSymbol}`],
      [t`Price impact`, `${swap.priceImpact}%`],
      [t`Maximum sent`, swap.maximumSent && `${swap.maximumSent} ${inputSymbol}`],
      [t`Minimum received`, swap.minimumReceived && `${swap.minimumReceived} ${outputSymbol}`],
      [t`Slippage tolerance`, `${swap.slippageTolerance}%`],
    ].filter(isDetail)

    function isDetail(detail: unknown[]): detail is [string, string] {
      return Boolean(detail[1])
    }
  }, [inputSymbol, outputSymbol, swap, integrator])
  return (
    <>
      {details.map(([label, detail]) => (
        <Detail key={label} label={label} value={detail} />
      ))}
    </>
  )
}
