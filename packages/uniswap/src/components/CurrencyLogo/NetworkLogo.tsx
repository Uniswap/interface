import { isMobileWeb } from '@universe/environment'
import React from 'react'
import type { ImageSourcePropType } from 'react-native'
import { Flex, FlexProps, Image, Loader, useSporeColors } from 'ui/src'
import { ALL_NETWORKS_LOGO } from 'ui/src/assets'
import { iconSizes, zIndexes } from 'ui/src/theme'
import { getBadgeBorderRadius, getBadgeOuterSize } from 'uniswap/src/components/CurrencyLogo/badgeSizeUtils'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

type NetworkLogoProps = FlexProps & {
  chainId: UniverseChainId | null // null signifies this is the AllNetworks logo
  size?: number
  shape?: 'circle' | 'square'
  borderWidth?: number
  borderRadius?: number
  loading?: boolean
}

const SUBPIXEL_COMPENSATION = 1 // prevents gaps between logo and border on different screens/zoom levels

export function TransactionSummaryNetworkLogo({
  chainId,
  size = iconSizes.icon20,
}: Pick<NetworkLogoProps, 'chainId' | 'size'>): JSX.Element {
  return <NetworkLogo borderWidth={1.6} chainId={chainId} shape="square" size={size} />
}

function NetworkLogoInner({
  chainId,
  shape,
  size: sizeWithoutBorder = iconSizes.icon20,
  borderWidth = 0,
  borderRadius,
  loading,
  transition,
}: NetworkLogoProps): JSX.Element | null {
  const size = getBadgeOuterSize(sizeWithoutBorder, borderWidth)
  const shapeBorderRadius = getBadgeBorderRadius(size, shape ?? 'square')
  const colors = useSporeColors()

  const imageStyle = {
    width: size,
    height: size,
    borderRadius: borderRadius ?? shapeBorderRadius,
    borderWidth,
    borderColor: colors.surface1.get(),
  }

  if (loading) {
    return <Loader.Box height={size} width={size} borderRadius={borderRadius ?? shapeBorderRadius} />
  }

  if (chainId === null) {
    return (
      <Flex testID="all-networks-logo">
        <NetworkImage logo={ALL_NETWORKS_LOGO} imageSize={size} transition={transition} />
      </Flex>
    )
  }

  const logo = getChainInfo(chainId).logo

  const imageSize = size + SUBPIXEL_COMPENSATION - borderWidth * 2 // this prevents the border from cutting off the logo

  return logo ? (
    <Flex centered testID={`network-logo-${chainId}`} overflow="hidden" style={imageStyle} zIndex={zIndexes.mask}>
      <NetworkImage logo={logo} imageSize={imageSize} transition={transition} />
    </Flex>
  ) : null
}

function NetworkImage({
  logo,
  imageSize,
  transition,
}: {
  logo: ImageSourcePropType
  imageSize: number
  transition?: FlexProps['transition']
}): JSX.Element {
  // As of iOS 18.3 network logos are no longer displaying because react-native-web-lite
  // adds z-index: -1 to the image. This is a workaround to display the logos on mobile web.
  return isMobileWeb && typeof logo === 'string' ? (
    <img src={logo} style={{ width: imageSize, height: imageSize, transition }} />
  ) : (
    <Image objectFit="contain" source={logo} width={imageSize} height={imageSize} transition={transition} />
  )
}

export const NetworkLogo = React.memo(NetworkLogoInner)
