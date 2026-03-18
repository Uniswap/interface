import React, { memo, useMemo } from 'react'
import { getToken, SpaceTokens } from 'tamagui'
import { Flex, Separator } from 'ui/src/components/layout'
import { useDeviceDimensions } from 'ui/src/hooks/useDeviceDimensions/useDeviceDimensions'
import { FlexLoader, FlexLoaderProps } from 'ui/src/loading/FlexLoader'
import { InsufficientFundsNetworkRowLoader } from 'ui/src/loading/InsufficientFundsNetworkRowLoader'
import { NftCardLoader } from 'ui/src/loading/NftCardLoader'
import { Skeleton } from 'ui/src/loading/Skeleton'
import { TokenLoader } from 'ui/src/loading/TokenLoader'
import { TransactionLoader } from 'ui/src/loading/TransactionLoader'
import { WalletLoader } from 'ui/src/loading/WalletLoader'
import { fonts } from 'ui/src/theme'

const Transaction = memo(function _Transaction({ repeat = 1 }: { repeat?: number }): JSX.Element {
  return (
    <Skeleton>
      <Flex>
        {/* eslint-disable-next-line max-params */}
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

const TransferInstitution = memo(function _TransferInstitution({
  itemsCount,
  iconSize,
}: {
  itemsCount: number
  iconSize: number
}): JSX.Element {
  const { fullWidth } = useDeviceDimensions()
  const LINKED_TEXT_WIDTH = 40
  return (
    <Flex>
      {new Array(itemsCount).fill(null).map((_, i) => (
        <Flex key={i} row alignItems="center" gap="$spacing12" mb="$spacing12" mx="$spacing8" p="$spacing16">
          <Flex grow row alignItems="center" gap="$spacing12">
            <Loader.Box borderRadius="$rounded12" height={iconSize} width={iconSize} />
            <Loader.Box borderRadius="$rounded4" height={fonts.body3.lineHeight} width={fullWidth / 3} />
          </Flex>
          <Loader.Box borderRadius="$rounded4" height={fonts.body3.lineHeight} width={LINKED_TEXT_WIDTH} />
        </Flex>
      ))}
    </Flex>
  )
})

function Box(props: FlexLoaderProps): JSX.Element {
  return (
    <Skeleton>
      <FlexLoader {...props} />
    </Skeleton>
  )
}

function Token({
  repeat = 1,
  contrast,
  withPrice,
  gap = '$spacing4',
}: {
  repeat?: number
  contrast?: boolean
  withPrice?: boolean
  gap?: SpaceTokens
}): JSX.Element {
  return (
    <Skeleton contrast={contrast}>
      <Flex grow gap={gap}>
        {/* eslint-disable-next-line max-params */}
        {new Array(repeat).fill(null).map((_, i, { length }) => (
          <React.Fragment key={i}>
            <TokenLoader opacity={(length - i) / length} withPrice={withPrice} />
          </React.Fragment>
        ))}
      </Flex>
    </Skeleton>
  )
}

function InsufficientFundsNetworkRow({ repeat = 1, contrast }: { repeat?: number; contrast?: boolean }): JSX.Element {
  return (
    <Skeleton contrast={contrast}>
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
          {/* eslint-disable-next-line max-params */}
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
      <FlexLoader aspectRatio={1} borderRadius={getToken('$none', 'radius')} />
    </Skeleton>
  )
}

function Wallets({ repeat = 1 }: { repeat?: number }): JSX.Element {
  return (
    <Skeleton>
      <Flex gap="$spacing12">
        {/* eslint-disable-next-line max-params */}
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
  TransferInstitution,
  Transaction,
  Wallets,
}
