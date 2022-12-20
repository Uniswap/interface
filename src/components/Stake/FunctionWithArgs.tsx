import { BigNumber } from '@ethersproject/bignumber'
import Row from 'components/Row'
import { ConstructorFragment, isAddress } from 'ethers/lib/utils'
import React from 'react'
import { Box, Text } from 'theme-ui'
import { shortenAddress } from 'utils'

interface Props {
  frag: ConstructorFragment
  args?: readonly unknown[]
}

/**
 * Renders a solidity function fragment with call args.
 * @param frag
 * @paramargs
 */
export const FunctionWithArgs = ({ frag, args }: Props): React.ReactElement => {
  if (!args || args.length === 0) {
    return (
      <Box>
        <Text>{frag.name}()</Text>
      </Box>
    )
  }

  return (
    <div>
      <div>{frag.name}(</div>
      {frag.inputs.map((input, i) => (
        <Row key={i} fontSize={13} margin="3px 6px">
          {input.format('full')}&nbsp;{renderValue(args[i])}
          {i !== frag.inputs.length - 1 ? ', ' : ''}
        </Row>
      ))}
      <div>)</div>
    </div>
  )
}

const renderValue = (value: unknown): React.ReactNode => {
  if (typeof value === 'undefined' || value === null || (Array.isArray(value) && value.length === 0)) {
    return <Text>(EMPTY)</Text>
  }

  if (Array.isArray(value)) {
    return (
      <>
        [
        {value.map((v, i) => (
          <>
            {renderValue(v)}
            {i !== value.length - 1 ? ', ' : ''}
          </>
        ))}
        ]
      </>
    )
  }

  if (typeof value === 'string' && isAddress(value)) {
    return <Text>{shortenAddress(value)}</Text>
  }

  if (typeof value === 'string' || typeof value === 'number') {
    return <Text variant="highlight">{value}</Text>
  }

  if (BigNumber.isBigNumber(value)) {
    return <Text variant="highlight">{value.toString()}</Text>
  }

  return <Text variant="highlight">{JSON.stringify(value)}</Text>
}
