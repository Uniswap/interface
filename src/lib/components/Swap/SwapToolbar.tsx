import { useAtomValue } from 'jotai/utils'
import styled from 'lib/theme'
import TYPE from 'lib/theme/type'
import { useMemo, useState } from 'react'

import { TextButton } from '../Button'
import Row from '../Row'
import Rule from '../Rule'
import { inputAtom, outputAtom, State, swapAtom } from './state'

const Ratio = styled(TextButton)`
  text-align: start;

  :hover {
    opacity: 1;
  }
`

export default function SwapToolbar() {
  const input = useAtomValue(inputAtom)
  const output = useAtomValue(outputAtom)
  const swap = useAtomValue(swapAtom)

  const [flip, setFlip] = useState(true)
  const [loaded, ratio] = useMemo(() => {
    if (
      swap.state !== State.LOADING &&
      input.value &&
      input.token &&
      output.value &&
      output.token &&
      swap.input &&
      swap.output
    ) {
      const ratio = flip
        ? `1 ${output.token.symbol} = ${input.value / output.value} ${
            output.token.symbol
          } ($${swap.output.usdc.toLocaleString('en')})`
        : `1 ${input.token.symbol} = ${output.value / input.value} ${
            input.token.symbol
          } ($${swap.input.usdc.toLocaleString('en')})`
      return [true, ratio]
    }
    return [false]
  }, [flip, input.token, input.value, output.token, output.value, swap.input, swap.output, swap.state])

  return (
    <>
      <Rule />
      <Row grow>
        <Ratio onClick={() => setFlip(!flip)}>
          <TYPE.caption>{loaded ? ratio : 'Uniswap V3'}</TYPE.caption>
        </Ratio>
      </Row>
    </>
  )
}
