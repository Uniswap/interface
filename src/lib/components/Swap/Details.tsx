import { Trans } from '@lingui/macro'
import { useAtomValue } from 'jotai/utils'
import { ThemedText } from 'lib/theme'
import { ReactNode } from 'react'

import Column from '../Column'
import Row from '../Row'
import { swapAtom } from './state'

function Detail({ children }: { children: ReactNode }) {
  return (
    <ThemedText.Caption>
      <Row gap={2}>{children}</Row>
    </ThemedText.Caption>
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
        <span>
          <Trans>Liquidity provider fee</Trans>
        </span>
        {swap.lpFee}&emsp;{input.token.symbol}
      </Detail>
      <Detail>
        <span>
          <Trans>Integrator fee</Trans>
        </span>
        {swap.integratorFee}&emsp;{input.token.symbol}
      </Detail>
      <Detail>
        <span>
          <Trans>Price impact</Trans>
        </span>
        {swap.priceImpact}%
      </Detail>
      {swap.maximumSent && (
        <Detail>
          <span>
            <Trans>Maximum sent</Trans>
          </span>
          {swap.maximumSent}&emsp;{input.token.symbol}
        </Detail>
      )}
      {swap.minimumReceived && (
        <Detail>
          <span>
            <Trans>Minimum received</Trans>
          </span>
          {swap.minimumReceived}&emsp;{output.token.symbol}
        </Detail>
      )}
      <Detail>
        <span>
          <Trans>Slippage tolerance</Trans>
        </span>
        {swap.slippageTolerance}%
      </Detail>
    </Column>
  )
}
