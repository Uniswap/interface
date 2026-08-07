import React, { memo } from 'react'
import { TransactionLoader } from 'src/components/loading/parts/TransactionLoader'
import { useChartDimensions } from 'src/components/PriceExplorer/useChartDimensions'
import { Flex, FlexLoader, FlexLoaderProps, getToken, Skeleton, WaveLoader } from 'ui/src'

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
      <FlexLoader aspectRatio={1} borderRadius={getToken('$none', 'radius')} />
    </Skeleton>
  )
}

function Favorite({
  height,
  contrast,
  ...props
}: { height?: number; contrast?: boolean } & FlexLoaderProps): JSX.Element {
  return (
    <Skeleton contrast={contrast}>
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
