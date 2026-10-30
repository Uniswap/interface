import { Flex, FlexLoader, type FlexLoaderProps, type FlexProps, Skeleton } from '@universe/mycelium'
import React, { memo, useMemo } from 'react'
import { Separator } from 'ui/src/components/layout'
import { InsufficientFundsNetworkRowLoader } from 'ui/src/loading/InsufficientFundsNetworkRowLoader'
import { NftCardLoader } from 'ui/src/loading/NftCardLoader'
import { TokenLoader } from 'ui/src/loading/TokenLoader'
import { TransactionLoader } from 'ui/src/loading/TransactionLoader'
import { WalletLoader } from 'ui/src/loading/WalletLoader'

const Transaction = memo(function _Transaction({ repeat = 1 }: { repeat?: number }): JSX.Element {
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

/**
 * Loader used for search results e.g. search, recipient etc...
 */
const SearchResult = memo(function _SearchResult({ repeat = 1 }: { repeat?: number }): JSX.Element {
  return <Transaction repeat={repeat} />
})

function Box({ disableShimmer, ...props }: FlexLoaderProps & { disableShimmer?: boolean }): JSX.Element {
  return (
    <Skeleton disabled={disableShimmer}>
      <FlexLoader {...props} />
    </Skeleton>
  )
}

function Token({
  repeat = 1,
  withPrice,
  gap = '$spacing4',
}: {
  repeat?: number
  withPrice?: boolean
  // Typed off the Flex prop the value lands on, so it tracks the layout primitive's own
  // rebuild instead of pinning the legacy Tamagui SpaceTokens union here.
  gap?: FlexProps['gap']
}): JSX.Element {
  return (
    <Skeleton>
      <Flex grow gap={gap}>
        {/* oxlint-disable-next-line max-params */}
        {new Array(repeat).fill(null).map((_, i, { length }) => (
          <React.Fragment key={i}>
            <TokenLoader opacity={(length - i) / length} withPrice={withPrice} />
          </React.Fragment>
        ))}
      </Flex>
    </Skeleton>
  )
}

function InsufficientFundsNetworkRow({ repeat = 1 }: { repeat?: number }): JSX.Element {
  return (
    <Skeleton>
      <Flex grow>
        {Array.from({ length: repeat }, (_, i) => (
          <React.Fragment key={i}>
            <InsufficientFundsNetworkRowLoader opacity={(repeat - i) / repeat} />
            {i < repeat - 1 && <Separator my="$spacing8" />}
          </React.Fragment>
        ))}
      </Flex>
    </Skeleton>
  )
}

function NFT({ repeat = 1 }: { repeat?: number }): JSX.Element {
  const loader = useMemo(
    () =>
      repeat === 1 ? (
        <NftCardLoader opacity={1} />
      ) : (
        <Flex>
          {/* oxlint-disable-next-line max-params */}
          {new Array(Math.floor(repeat / 2)).fill(null).map((_, i, { length }) => {
            const opacity = (length - i) / length
            return (
              <Flex key={i} row>
                <NftCardLoader opacity={opacity} width="50%" />
                <NftCardLoader opacity={opacity} width="50%" />
              </Flex>
            )
          })}
        </Flex>
      ),
    [repeat],
  )

  return <Skeleton>{loader}</Skeleton>
}

function Image(): JSX.Element {
  return (
    <Skeleton>
      {/* 0 is the exact value the legacy getToken('$none', 'radius') resolved to; the $none
          token spelling resolves to a CSS var on web instead of the literal the old code set. */}
      <FlexLoader aspectRatio={1} borderRadius={0} />
    </Skeleton>
  )
}

function Wallets({ repeat = 1 }: { repeat?: number }): JSX.Element {
  return (
    <Skeleton>
      <Flex gap="$spacing12">
        {/* oxlint-disable-next-line max-params */}
        {new Array(repeat).fill(null).map((_, i, { length }) => (
          <React.Fragment key={i}>
            <WalletLoader opacity={(length - i) / length} />
          </React.Fragment>
        ))}
      </Flex>
    </Skeleton>
  )
}

export const Loader = {
  Box,
  InsufficientFundsNetworkRow,
  NFT,
  Image,
  SearchResult,
  Token,
  Transaction,
  Wallets,
}
