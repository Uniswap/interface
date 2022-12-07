import MaskedView from '@react-native-masked-view/masked-view'
import React, { ComponentProps } from 'react'
import { Box, Flex } from 'src/components/layout'
import { BoxLoader } from 'src/components/loading/BoxLoader'
import { FavoriteLoader } from 'src/components/loading/FavoriteLoader'
import { NftCardLoader } from 'src/components/loading/NftCardLoader'
import { PriceHeaderLoader } from 'src/components/loading/PriceHeaderLoader'
import { Shimmer } from 'src/components/loading/Shimmer'
import { TokenBalanceLoader } from 'src/components/loading/TokenBalanceLoader'
import { TokenLoader } from 'src/components/loading/TokenLoader'
import TransactionLoader from 'src/components/loading/TransactionLoader'
import { WalletLoader } from 'src/components/loading/WalletLoader'
import { WaveLoader } from 'src/components/loading/WaveLoader'

type SkeletonType =
  | 'box'
  | 'favorite'
  | 'graph'
  | 'image'
  | 'nft'
  | 'token'
  | 'transactions'
  | 'wallets'
  | 'price-header'
  | 'balance'
  | 'nft-collection-button'

type LoadingProps = {
  type?: SkeletonType
  repeat?: number
  height?: number

  // use this instead of React.PropsWithChildren because MaskedView doesn't accept
  // every kind of ReactNode as a valid mask element
  children?: ComponentProps<typeof MaskedView>['maskElement']
}

const getChildFromType = (type: SkeletonType, repeat: number, height?: number) => {
  switch (type) {
    case 'graph':
      return <WaveLoader />
    case 'token':
      return (
        <Flex>
          {new Array(repeat).fill(null).map((_, i, { length }) => (
            <React.Fragment key={i}>
              <TokenLoader opacity={(length - i) / length} />
            </React.Fragment>
          ))}
        </Flex>
      )
    case 'wallets':
      return (
        <Flex gap="sm">
          {new Array(repeat).fill(null).map((_, i, { length }) => (
            <React.Fragment key={i}>
              <WalletLoader opacity={(length - i) / length} />
            </React.Fragment>
          ))}
        </Flex>
      )
    case 'favorite':
      return <FavoriteLoader height={height} />
    case 'transactions':
      return <TransactionLoader />
    case 'image':
      if (repeat > 1) throw new Error('Loading placeholder for images does not support repeat')
      return <BoxLoader aspectRatio={1} borderRadius="none" />
    case 'nft':
      return repeat === 1 ? (
        <NftCardLoader opacity={1} />
      ) : (
        <Box>
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
        </Box>
      )
    case 'price-header':
      return <PriceHeaderLoader />
    case 'balance':
      return <TokenBalanceLoader />
    case 'nft-collection-button':
      return <BoxLoader borderRadius="lg" height={64} />
    case 'box':
    default:
      return (
        <Box>
          {new Array(repeat).fill(null).map((_, i) => (
            <React.Fragment key={i}>
              <BoxLoader height={height ?? 50} mb="sm" />
            </React.Fragment>
          ))}
        </Box>
      )
  }
}

export function Loading({ type = 'box', repeat = 1, height, children }: LoadingProps) {
  const child = children ?? getChildFromType(type, repeat, height)

  return <Shimmer>{child}</Shimmer>
}
