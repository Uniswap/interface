import React, { memo } from 'react'
import { Flex } from 'ui/src/components/layout'
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

export const Loader = {
  Transaction,
}
