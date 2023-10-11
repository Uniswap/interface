import React, { memo } from 'react'
import { TokenLoader } from 'src/components/loading/TokenLoader'
import { TransactionLoader } from 'src/components/loading/TransactionLoader'
import { WalletLoader } from 'src/components/loading/WalletLoader'
import { WaveLoader } from 'src/components/loading/WaveLoader'
import { Flex, getToken } from 'ui/src'
import { FlexLoader, FlexLoaderProps, Shimmer } from 'ui/src/loading'

function Graph(): JSX.Element {
  return (
    <Shimmer>
      <WaveLoader />
    </Shimmer>
  )
}

function Wallets({ repeat = 1 }: { repeat?: number }): JSX.Element {
  return (
    <Shimmer>
      <Flex gap="$spacing12">
        {new Array(repeat).fill(null).map((_, i, { length }) => (
          <React.Fragment key={i}>
            <WalletLoader opacity={(length - i) / length} />
          </React.Fragment>
        ))}
      </Flex>
    </Shimmer>
  )
}

function Token({ repeat = 1, contrast }: { repeat?: number; contrast?: boolean }): JSX.Element {
  return (
    <Shimmer contrast={contrast}>
      <Flex grow gap="$spacing4">
        {new Array(repeat).fill(null).map((_, i, { length }) => (
          <React.Fragment key={i}>
            <TokenLoader opacity={(length - i) / length} />
          </React.Fragment>
        ))}
      </Flex>
    </Shimmer>
  )
}

export const Transaction = memo(function _Transaction({
  repeat = 1,
}: {
  repeat?: number
}): JSX.Element {
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

function Box(props: FlexLoaderProps): JSX.Element {
  return (
    <Shimmer>
      <FlexLoader {...props} />
    </Shimmer>
  )
}

function Image(): JSX.Element {
  return (
    <Shimmer>
      <FlexLoader aspectRatio={1} borderRadius={getToken('$none', 'radius')} />
    </Shimmer>
  )
}

function Favorite({ height, contrast }: { height?: number; contrast?: boolean }): JSX.Element {
  return (
    <Shimmer contrast={contrast}>
      {/* surface3 because these only show up on explore modal which has a blurred bg that makes neutral3 look weird */}
      <FlexLoader backgroundColor="$surface3" borderRadius="$rounded16" height={height ?? 50} />
    </Shimmer>
  )
}

export const Loader = {
  Box,
  Token,
  Transaction,
  Wallets,
  Graph,
  Image,
  Favorite,
}
