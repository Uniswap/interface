import React, { memo } from 'react'
import { getToken } from 'ui/src'
import { Flex } from 'ui/src/components/layout'
import { BoxLoader } from 'ui/src/components/loading/BoxLoader'
import { Shimmer } from 'ui/src/components/loading/Shimmer'
import { TransactionLoader } from './TransactionLoader'

export const Transaction = memo(({ repeat = 1 }: { repeat?: number }): JSX.Element => {
  return (
    <Shimmer>
      <Flex>
        {new Array(repeat).fill(null).map((_, i, { length }) => (
          <React.Fragment key={i}>
            <TransactionLoader opacity={(length - i) / length} />
          </React.Fragment>
        ))}
      </Flex>
    </Shimmer>
  )
})

function Image(): JSX.Element {
  return (
    <Shimmer>
      <BoxLoader aspectRatio={1} borderRadius={getToken('$none', 'radius')} />
    </Shimmer>
  )
}

export const Loader = {
  Image,
  Transaction,
}
