/* eslint-disable no-restricted-syntax */
import type { SVGProps } from 'nft/components/icons'
import React, { Suspense, forwardRef } from 'react'

const LazyIconWrapper = forwardRef<SVGSVGElement, { children: React.ReactElement<SVGProps> }>(({ children }, ref) => (
  <Suspense fallback={null}>{React.cloneElement(children, { ref })}</Suspense>
))

LazyIconWrapper.displayName = 'LazyIconWrapper'

const LazyVerifiedIcon = React.lazy(() => import('./icons').then((module) => ({ default: module.VerifiedIcon })))
const LazyReversedArrowsIcon = React.lazy(() =>
  import('./icons').then((module) => ({ default: module.ReversedArrowsIcon })),
)
const LazyApprovedCheckmarkIcon = React.lazy(() =>
  import('./icons').then((module) => ({ default: module.ApprovedCheckmarkIcon })),
)
const LazyOpenSeaMarketplaceIcon = React.lazy(() =>
  import('./icons').then((module) => ({ default: module.OpenSeaMarketplaceIcon })),
)
const LazyCollectionSelectedAssetIcon = React.lazy(() =>
  import('./icons').then((module) => ({ default: module.CollectionSelectedAssetIcon })),
)
const LazyNft20Icon = React.lazy(() => import('./icons').then((module) => ({ default: module.Nft20Icon })))
const LazyNftXIcon = React.lazy(() => import('./icons').then((module) => ({ default: module.NftXIcon })))
const LazyX2y2Icon = React.lazy(() => import('./icons').then((module) => ({ default: module.X2y2Icon })))
const LazySudoSwapIcon = React.lazy(() => import('./icons').then((module) => ({ default: module.SudoSwapIcon })))
const LazyLooksRareIcon = React.lazy(() => import('./icons').then((module) => ({ default: module.LooksRareIcon })))
const LazyLarvaLabsMarketplaceIcon = React.lazy(() =>
  import('./icons').then((module) => ({ default: module.LarvaLabsMarketplaceIcon })),
)

export const VerifiedIcon = forwardRef<SVGSVGElement, SVGProps>((props, ref) => (
  <LazyIconWrapper ref={ref}>
    <LazyVerifiedIcon {...props} />
  </LazyIconWrapper>
))
VerifiedIcon.displayName = 'VerifiedIcon'

export const ReversedArrowsIcon = forwardRef<SVGSVGElement, SVGProps & { size?: string }>((props, ref) => (
  <LazyIconWrapper ref={ref}>
    <LazyReversedArrowsIcon {...props} />
  </LazyIconWrapper>
))
ReversedArrowsIcon.displayName = 'ReversedArrowsIcon'

export const ApprovedCheckmarkIcon = forwardRef<SVGSVGElement, SVGProps>((props, ref) => (
  <LazyIconWrapper ref={ref}>
    <LazyApprovedCheckmarkIcon {...props} />
  </LazyIconWrapper>
))
ApprovedCheckmarkIcon.displayName = 'ApprovedCheckmarkIcon'

export const OpenSeaMarketplaceIcon = forwardRef<SVGSVGElement, SVGProps>((props, ref) => (
  <LazyIconWrapper ref={ref}>
    <LazyOpenSeaMarketplaceIcon {...props} />
  </LazyIconWrapper>
))
OpenSeaMarketplaceIcon.displayName = 'OpenSeaMarketplaceIcon'

export const CollectionSelectedAssetIcon = forwardRef<SVGSVGElement, SVGProps>((props, ref) => (
  <LazyIconWrapper ref={ref}>
    <LazyCollectionSelectedAssetIcon {...props} />
  </LazyIconWrapper>
))
CollectionSelectedAssetIcon.displayName = 'CollectionSelectedAssetIcon'

export const Nft20Icon = forwardRef<SVGSVGElement, SVGProps>((props, ref) => (
  <LazyIconWrapper ref={ref}>
    <LazyNft20Icon {...props} />
  </LazyIconWrapper>
))
Nft20Icon.displayName = 'Nft20Icon'

export const NftXIcon = forwardRef<SVGSVGElement, SVGProps>((props, ref) => (
  <LazyIconWrapper ref={ref}>
    <LazyNftXIcon {...props} />
  </LazyIconWrapper>
))
NftXIcon.displayName = 'NftXIcon'

export const X2y2Icon = forwardRef<SVGSVGElement, SVGProps>((props, ref) => (
  <LazyIconWrapper ref={ref}>
    <LazyX2y2Icon {...props} />
  </LazyIconWrapper>
))
X2y2Icon.displayName = 'X2y2Icon'

export const SudoSwapIcon = forwardRef<SVGSVGElement, SVGProps>((props, ref) => (
  <LazyIconWrapper ref={ref}>
    <LazySudoSwapIcon {...props} />
  </LazyIconWrapper>
))
SudoSwapIcon.displayName = 'SudoSwapIcon'

export const LooksRareIcon = forwardRef<SVGSVGElement, SVGProps>((props, ref) => (
  <LazyIconWrapper ref={ref}>
    <LazyLooksRareIcon {...props} />
  </LazyIconWrapper>
))
LooksRareIcon.displayName = 'LooksRareIcon'

export const LarvaLabsMarketplaceIcon = forwardRef<SVGSVGElement, SVGProps>((props, ref) => (
  <LazyIconWrapper ref={ref}>
    <LazyLarvaLabsMarketplaceIcon {...props} />
  </LazyIconWrapper>
))
LarvaLabsMarketplaceIcon.displayName = 'LarvaLabsMarketplaceIcon'
