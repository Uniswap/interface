import { t } from '@lingui/macro'
import { Currency } from '@uniswap/sdk-core'
import { useAtom } from 'jotai'
import { useAtomValue } from 'jotai/utils'
import { settingsAtom } from 'lib/state/settings'
import { integratorFeeAtom } from 'lib/state/swap'
import { ThemedText } from 'lib/theme'
import { useMemo } from 'react'
import { currencyId } from 'utils/currencyId'

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
  input: Currency
  output: Currency
}

export default function Details({ input, output }: DetailsProps) {
  const integrator = window.location.hostname

  const { maxSlippage } = useAtomValue(settingsAtom)
  const [integratorFee] = useAtom(integratorFeeAtom)

  const details = useMemo((): [string, string][] => {
    // @TODO(ianlapham) = update details to pull derived value from useDerivedSwapInfo
    return [
      // [t`Liquidity provider fee`, `${swap.lpFee} ${inputSymbol}`],
      [t`${integrator} fee`, integratorFee && `${integratorFee} ${currencyId(input)}`],
      // [t`Price impact`, `${swap.priceImpact}%`],
      // [t`Maximum sent`, swap.maximumSent && `${swap.maximumSent} ${inputSymbol}`],
      // [t`Minimum received`, swap.minimumReceived && `${swap.minimumReceived} ${outputSymbol}`],
      [t`Slippage tolerance`, `${maxSlippage}%`],
    ].filter(isDetail)

    function isDetail(detail: unknown[]): detail is [string, string] {
      return Boolean(detail[1])
    }
  }, [input, integrator, integratorFee, maxSlippage])
  return (
    <>
      {details.map(([label, detail]) => (
        <Detail key={label} label={label} value={detail} />
      ))}
    </>
  )
}
