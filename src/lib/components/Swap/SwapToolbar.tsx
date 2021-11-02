import { useAtomValue } from 'jotai/utils'
import styled, { icon, OriginalProvider } from 'lib/theme'
import TYPE from 'lib/theme/type'
import { useMemo, useState } from 'react'
import { Info } from 'react-feather'

import { TextButton } from '../Button'
import Column from '../Column'
import Row from '../Row'
import Rule from '../Rule'
import Tooltip from '../Tooltip'
import { inputAtom, outputAtom, swapAtom } from './state'
import SwapDetails from './SwapDetails'

const InfoIcon = icon(Info, { color: 'primary' })

const Ratio = styled(TextButton)`
  text-align: start;

  :hover {
    opacity: 1;
  }
`

function SwapDetailsTooltip() {
  return (
    <Tooltip icon={InfoIcon} placement="bottom">
      <OriginalProvider>
        <Column gap={0.75}>
          <TYPE.subhead2>Transaction details</TYPE.subhead2>
          <Rule />
          <SwapDetails />
        </Column>
      </OriginalProvider>
    </Tooltip>
  )
}

export default function SwapToolbar() {
  const input = useAtomValue(inputAtom)
  const output = useAtomValue(outputAtom)
  const { swap } = useAtomValue(swapAtom)

  const [flip, setFlip] = useState(true)
  const [loaded, ratio] = useMemo(() => {
    if (input.value && input.token && input.usdc && output.value && output.token && output.usdc) {
      const ratio = flip
        ? `1 ${output.token.symbol} = ${input.value / output.value} ${
            output.token.symbol
          } ($${output.usdc.toLocaleString('en')})`
        : `1 ${input.token.symbol} = ${output.value / input.value} ${input.token.symbol} ($${input.usdc.toLocaleString(
            'en'
          )})`
      return [true, ratio]
    }
    return [false]
  }, [flip, input.token, input.usdc, input.value, output.token, output.usdc, output.value])

  return (
    <>
      <Rule />
      <Row justify="flex-start" gap={0.5}>
        {swap && <SwapDetailsTooltip />}
        {loaded ? (
          <Ratio onClick={() => setFlip(!flip)}>
            <TYPE.caption>{ratio}</TYPE.caption>
          </Ratio>
        ) : (
          <TYPE.caption>Uniswap V3</TYPE.caption>
        )}
      </Row>
    </>
  )
}
