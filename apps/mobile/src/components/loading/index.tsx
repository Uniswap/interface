import React, { memo } from 'react'
import { TransactionLoader } from 'src/components/loading/TransactionLoader'
import { WaveLoader } from 'src/components/loading/WaveLoader'
import { Flex, FlexLoader, FlexLoaderProps, getToken, Skeleton } from 'ui/src'

function Graph(): JSX.Element {
  return (
    <Skeleton>
      <WaveLoader />
    </Skeleton>
  )
}

export const Transaction = memo(function _Transaction({
  repeat = 1,
}: {
  repeat?: number
}): JSX.Element {
  return (
    <Skeleton>
      <Flex>
        {new Array(repeat).fill(null).map((_, i, { length }) => (
          <React.Fragment key={i}>
            <TransactionLoader opacity={(length - i) / length} />
          </React.Fragment>
        ))}
      </Flex>
    </Skeleton>
  )
})

function Box(props: FlexLoaderProps): JSX.Element {
  return (
    <Skeleton>
      <FlexLoader {...props} />
    </Skeleton>
  )
}

function Image(): JSX.Element {
  return (
    <Skeleton>
      <FlexLoader aspectRatio={1} borderRadius={getToken('$none', 'radius')} />
    </Skeleton>
  )
}

function Favorite({ height, contrast }: { height?: number; contrast?: boolean }): JSX.Element {
  return (
    <Skeleton contrast={contrast}>
      {/* surface3 because these only show up on explore modal which has a blurred bg that makes neutral3 look weird */}
      <FlexLoader backgroundColor="$surface3" borderRadius="$rounded16" height={height ?? 50} />
    </Skeleton>
  )
}

export const Loader = {
  Box,
  Transaction,
  Graph,
  Image,
  Favorite,
}
