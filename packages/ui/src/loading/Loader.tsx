import React, { memo, useMemo } from 'react'
import { getToken } from 'tamagui'
import { Flex } from 'ui/src/components/layout'
import { useDeviceDimensions } from 'ui/src/hooks/useDeviceDimensions'
import { FlexLoader, FlexLoaderProps } from 'ui/src/loading/FlexLoader'
import { NftCardLoader } from 'ui/src/loading/NftCardLoader'
import { Skeleton } from 'ui/src/loading/Skeleton'
import { TokenLoader } from 'ui/src/loading/TokenLoader'
import { fonts } from 'ui/src/theme'
import { TransactionLoader } from './TransactionLoader'
import { WalletLoader } from './WalletLoader'

const Transaction = memo(function _Transaction({ repeat = 1 }: { repeat?: number }): JSX.Element {
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
        <Flex
          key={i}
          row
          alignItems="center"
          gap="$spacing12"
          mb="$spacing12"
          mx="$spacing8"
          p="$spacing16">
          <Flex grow row alignItems="center" gap="$spacing12">
            <Loader.Box borderRadius="$rounded12" height={iconSize} width={iconSize} />
            <Loader.Box
              borderRadius="$rounded4"
              height={fonts.body3.lineHeight}
              width={fullWidth / 3}
            />
          </Flex>
          <Loader.Box
            borderRadius="$rounded4"
            height={fonts.body3.lineHeight}
            width={LINKED_TEXT_WIDTH}
          />
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
}: {
  repeat?: number
  contrast?: boolean
  withPrice?: boolean
}): JSX.Element {
  return (
    <Skeleton contrast={contrast}>
      <Flex grow gap="$spacing4">
        {new Array(repeat).fill(null).map((_, i, { length }) => (
          <React.Fragment key={i}>
            <TokenLoader opacity={(length - i) / length} withPrice={withPrice} />
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
    [repeat]
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
  NFT,
  Image,
  Token,
  TransferInstitution,
  Transaction,
  Wallets,
}
