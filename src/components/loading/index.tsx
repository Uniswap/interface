import React, { memo, useMemo } from 'react'
import { Box as BoxComponent, Flex } from 'src/components/layout'
import { BoxLoader, BoxLoaderProps } from 'src/components/loading/BoxLoader'
import { NftCardLoader } from 'src/components/loading/NftCardLoader'
import { Shimmer } from 'src/components/loading/Shimmer'
import { TokenLoader } from 'src/components/loading/TokenLoader'
import { TransactionLoader } from 'src/components/loading/TransactionLoader'
import { WalletLoader } from 'src/components/loading/WalletLoader'
import { WaveLoader } from 'src/components/loading/WaveLoader'

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
      <Flex gap="spacing12">
        {new Array(repeat).fill(null).map((_, i, { length }) => (
          <React.Fragment key={i}>
            <WalletLoader opacity={(length - i) / length} />
          </React.Fragment>
        ))}
      </Flex>
    </Shimmer>
  )
}

function Token({ repeat = 1 }: { repeat?: number }): JSX.Element {
  return (
    <Shimmer>
      <Flex grow gap="spacing4">
        {new Array(repeat).fill(null).map((_, i, { length }) => (
          <React.Fragment key={i}>
            <TokenLoader opacity={(length - i) / length} />
          </React.Fragment>
        ))}
      </Flex>
    </Shimmer>
  )
}

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

function NFT({ repeat = 1 }: { repeat?: number }): JSX.Element {
  const loader = useMemo(
    () =>
      repeat === 1 ? (
        <NftCardLoader opacity={1} />
      ) : (
        <BoxComponent>
          {new Array(repeat / 2).fill(null).map((_, i) => {
            const firstColOpacity = (repeat - ((repeat / 2) * i + 1) + 1) / repeat
            const secondColOpacity = (repeat - ((repeat / 2) * i + 2) + 1) / repeat
            return (
              <React.Fragment key={i}>
                <Flex row gap="none">
                  <NftCardLoader opacity={firstColOpacity} width="50%" />
                  <NftCardLoader opacity={secondColOpacity} width="50%" />
                </Flex>
              </React.Fragment>
            )
          })}
        </BoxComponent>
      ),
    [repeat]
  )

  return <Shimmer>{loader}</Shimmer>
}

function Box(props: BoxLoaderProps): JSX.Element {
  return (
    <Shimmer>
      <BoxLoader {...props} />
    </Shimmer>
  )
}

function Image(): JSX.Element {
  return (
    <Shimmer>
      <BoxLoader aspectRatio={1} borderRadius="none" />
    </Shimmer>
  )
}

function Favorite({ height }: { height?: number }): JSX.Element {
  return (
    <Shimmer>
      <BoxLoader
        backgroundColor="backgroundOutline"
        borderRadius="rounded16"
        height={height ?? 50}
      />
    </Shimmer>
  )
}

export const Loader = {
  Box,
  NFT,
  Token,
  Transaction,
  Wallets,
  Graph,
  Image,
  Favorite,
}
