import { t } from '@lingui/macro'
import { useAtomValue } from 'jotai/utils'
import TYPE from 'lib/theme/type'
import { ReactNode } from 'react'

import Column from '../Column'
import Row from '../Row'
import { swapAtom } from './state'

function Detail({ children }: { children: ReactNode }) {
  return (
    <TYPE.caption>
      <Row gap={2}>{children}</Row>
    </TYPE.caption>
  )
}

export default function Details() {
  const { input, output, swap } = useAtomValue(swapAtom)
  if (!(input.token && output.token && swap)) {
    return null
  }

  return (
    <Column gap={0.75}>
      <Detail>
        <span>{t`Liquidity provider fee`}</span>
        {swap.lpFee}&emsp;{input.token.symbol}
      </Detail>
      <Detail>
        <span>{t`Integrator fee`}</span>
        {swap.integratorFee}&emsp;{input.token.symbol}
      </Detail>
      <Detail>
        <span>{t`Price impact`}</span>
        {swap.priceImpact}%
      </Detail>
      {swap.maximumSent && (
        <Detail>
          <span>{t`Maximum sent`}</span>
          {swap.maximumSent}&emsp;{input.token.symbol}
        </Detail>
      )}
      {swap.minimumReceived && (
        <Detail>
          <span>{t`Minimum received`}</span>
          {swap.minimumReceived}&emsp;{output.token.symbol}
        </Detail>
      )}
      <Detail>
        <span>{t`Slippage tolerance`}</span>
        {swap.slippageTolerance}%
      </Detail>
    </Column>
  )
}
