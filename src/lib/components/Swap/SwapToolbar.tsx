import { useAtomValue } from 'jotai/utils'
import styled from 'lib/theme'
import TYPE from 'lib/theme/type'
import { useMemo, useState } from 'react'

import { TextButton } from '../Button'
import Row from '../Row'
import Rule from '../Rule'
import { inputAtom, outputAtom } from './state'

const Ratio = styled(TextButton)`
  text-align: start;

  :hover {
    opacity: 1;
  }
`

export default function SwapToolbar() {
  const input = useAtomValue(inputAtom)
  const output = useAtomValue(outputAtom)

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
      <Row grow>
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
