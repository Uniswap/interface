// Drop-in for the legacy Loader namespace. No leg split of its own — primitives compose by their
// base specifier, so each bundler resolves the primitive's own web/native leg.
import React, { memo, useMemo, type JSX } from 'react'
import { FlexCompat } from '../flex-compat/FlexCompat'
import type { FlexCompatProps } from '../flex-compat/props'
import { FlexLoaderCompat } from '../flex-loader-compat/FlexLoaderCompat'
import type { FlexLoaderProps } from '../flex-loader-compat/props'
import { SeparatorCompat } from '../separator-compat/SeparatorCompat'
import { Shimmer } from '../shimmer'
import {
  InsufficientFundsNetworkRowLoader,
  NftCardLoader,
  TokenLoader,
  TransactionLoader,
  WalletLoader,
} from './loaders'

const Transaction = memo(function _Transaction({ repeat = 1 }: { repeat?: number }): JSX.Element {
  return (
    <Shimmer decorative>
      <FlexCompat>
        {/* oxlint-disable-next-line max-params */}
        {new Array(repeat).fill(null).map((_, i, { length }) => (
          <React.Fragment key={i}>
            <TransactionLoader opacity={(length - i) / length} />
          </React.Fragment>
        ))}
      </FlexCompat>
    </Shimmer>
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
    <Shimmer decorative disabled={disableShimmer}>
      <FlexLoaderCompat {...props} />
    </Shimmer>
  )
}

function Token({
  repeat = 1,
  withPrice,
  gap = '$spacing4',
}: {
  repeat?: number
  withPrice?: boolean
  // Typed off the Flex prop the value lands on, so it tracks the layout
  // primitive's own contract instead of pinning a token union here.
  gap?: FlexCompatProps['gap']
}): JSX.Element {
  return (
    <Shimmer decorative>
      <FlexCompat grow gap={gap}>
        {/* oxlint-disable-next-line max-params */}
        {new Array(repeat).fill(null).map((_, i, { length }) => (
          <React.Fragment key={i}>
            <TokenLoader opacity={(length - i) / length} withPrice={withPrice} />
          </React.Fragment>
        ))}
      </FlexCompat>
    </Shimmer>
  )
}

function InsufficientFundsNetworkRow({ repeat = 1 }: { repeat?: number }): JSX.Element {
  return (
    <Shimmer decorative>
      <FlexCompat grow>
        {Array.from({ length: repeat }, (_, i) => (
          <React.Fragment key={i}>
            <InsufficientFundsNetworkRowLoader opacity={(repeat - i) / repeat} />
            {i < repeat - 1 && <SeparatorCompat my="$spacing8" />}
          </React.Fragment>
        ))}
      </FlexCompat>
    </Shimmer>
  )
}

function NFT({ repeat = 1 }: { repeat?: number }): JSX.Element {
  const loader = useMemo(
    () =>
      repeat === 1 ? (
        <NftCardLoader opacity={1} />
      ) : (
        <FlexCompat>
          {/* oxlint-disable-next-line max-params */}
          {new Array(Math.floor(repeat / 2)).fill(null).map((_, i, { length }) => {
            const opacity = (length - i) / length
            return (
              <FlexCompat key={i} row>
                <NftCardLoader opacity={opacity} width="50%" />
                <NftCardLoader opacity={opacity} width="50%" />
              </FlexCompat>
            )
          })}
        </FlexCompat>
      ),
    [repeat],
  )

  return <Shimmer decorative>{loader}</Shimmer>
}

function Image(): JSX.Element {
  return (
    <Shimmer decorative>
      {/* 0 is the exact value the legacy getToken('$none', 'radius') resolved to; the $none
          token spelling resolves to a CSS var on web instead of the literal the old code set. */}
      <FlexLoaderCompat aspectRatio={1} borderRadius={0} />
    </Shimmer>
  )
}

function Wallets({ repeat = 1 }: { repeat?: number }): JSX.Element {
  return (
    <Shimmer decorative>
      <FlexCompat gap="$spacing12">
        {/* oxlint-disable-next-line max-params */}
        {new Array(repeat).fill(null).map((_, i, { length }) => (
          <React.Fragment key={i}>
            <WalletLoader opacity={(length - i) / length} />
          </React.Fragment>
        ))}
      </FlexCompat>
    </Shimmer>
  )
}

export const LoaderCompat = {
  Box,
  InsufficientFundsNetworkRow,
  NFT,
  Image,
  SearchResult,
  Token,
  Transaction,
  Wallets,
}
