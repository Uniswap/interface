import { Flex, FlexLoader, getTokenValue, type FlexLoaderProps, Skeleton } from '@universe/mycelium'
import React, { memo } from 'react'
import { TransactionLoader } from 'src/components/loading/parts/TransactionLoader'
import { useChartDimensions } from 'src/components/PriceExplorer/useChartDimensions'
import { WaveLoader } from 'ui/src'

function Graph(): JSX.Element {
  const { chartHeight } = useChartDimensions()

  return (
    <Skeleton>
      <WaveLoader height={chartHeight} />
    </Skeleton>
  )
}

const Transaction = memo(function TransactionInner({ repeat = 1 }: { repeat?: number }): JSX.Element {
  return (
    <Skeleton>
      <Flex>
        {/* oxlint-disable-next-line max-params */}
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
      <FlexLoader aspectRatio={1} borderRadius={getTokenValue('$none', 'radius')} />
    </Skeleton>
  )
}

function Favorite({ height, ...props }: { height?: number } & FlexLoaderProps): JSX.Element {
  return (
    <Skeleton>
      {/* surface3 because these only show up on explore modal which has a blurred bg that makes neutral3 look weird */}
      <FlexLoader
        backgroundColor="$surface3"
        borderRadius="$rounded16"
        height={height ?? 50}
        testID="loader/favorite"
        {...props}
      />
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
