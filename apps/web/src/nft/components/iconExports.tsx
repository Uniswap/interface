/* eslint-disable no-restricted-syntax */
import type { ChevronUpIconProps, SVGProps } from 'nft/components/icons'
import React, { Suspense, forwardRef } from 'react'

const LazyIconWrapper = forwardRef<SVGSVGElement, { children: React.ReactElement<SVGProps> }>(({ children }, ref) => (
  <Suspense fallback={null}>{React.cloneElement(children, { ref })}</Suspense>
))

LazyIconWrapper.displayName = 'LazyIconWrapper'

const LazyChevronUpIcon = React.lazy(() => import('./icons').then((module) => ({ default: module.ChevronUpIcon })))
const LazyBackArrowIcon = React.lazy(() => import('./icons').then((module) => ({ default: module.BackArrowIcon })))
const LazyVerifiedIcon = React.lazy(() => import('./icons').then((module) => ({ default: module.VerifiedIcon })))
const LazyXMarkIcon = React.lazy(() => import('./icons').then((module) => ({ default: module.XMarkIcon })))
const LazyLightningBoltIcon = React.lazy(() =>
  import('./icons').then((module) => ({ default: module.LightningBoltIcon })),
)
const LazyCrossIcon = React.lazy(() => import('./icons').then((module) => ({ default: module.CrossIcon })))
const LazyReversedArrowsIcon = React.lazy(() =>
  import('./icons').then((module) => ({ default: module.ReversedArrowsIcon })),
)
const LazyBrokenLinkIcon = React.lazy(() => import('./icons').then((module) => ({ default: module.BrokenLinkIcon })))
const LazyApprovedCheckmarkIcon = React.lazy(() =>
  import('./icons').then((module) => ({ default: module.ApprovedCheckmarkIcon })),
)
const LazyFilterIcon = React.lazy(() => import('./icons').then((module) => ({ default: module.FilterIcon })))
const LazyBagIcon = React.lazy(() => import('./icons').then((module) => ({ default: module.BagIcon })))
const LazyTagIcon = React.lazy(() => import('./icons').then((module) => ({ default: module.TagIcon })))
const LazyTwitterIcon = React.lazy(() => import('./icons').then((module) => ({ default: module.TwitterIcon })))
const LazyActivityListingIcon = React.lazy(() =>
  import('./icons').then((module) => ({ default: module.ActivityListingIcon })),
)
const LazyActivitySaleIcon = React.lazy(() =>
  import('./icons').then((module) => ({ default: module.ActivitySaleIcon })),
)
const LazyActivityTransferIcon = React.lazy(() =>
  import('./icons').then((module) => ({ default: module.ActivityTransferIcon })),
)
const LazyActivityExternalLinkIcon = React.lazy(() =>
  import('./icons').then((module) => ({ default: module.ActivityExternalLinkIcon })),
)
const LazyLargeTagIcon = React.lazy(() => import('./icons').then((module) => ({ default: module.LargeTagIcon })))
const LazyCircularCloseIcon = React.lazy(() =>
  import('./icons').then((module) => ({ default: module.CircularCloseIcon })),
)
const LazySquareArrowDownIcon = React.lazy(() =>
  import('./icons').then((module) => ({ default: module.SquareArrowDownIcon })),
)
const LazySquareArrowUpIcon = React.lazy(() =>
  import('./icons').then((module) => ({ default: module.SquareArrowUpIcon })),
)
const LazyCloseTimerIcon = React.lazy(() => import('./icons').then((module) => ({ default: module.CloseTimerIcon })))
const LazyChevronDownBagIcon = React.lazy(() =>
  import('./icons').then((module) => ({ default: module.ChevronDownBagIcon })),
)
const LazyChevronUpBagIcon = React.lazy(() =>
  import('./icons').then((module) => ({ default: module.ChevronUpBagIcon })),
)
const LazyBagCloseIcon = React.lazy(() => import('./icons').then((module) => ({ default: module.BagCloseIcon })))
const LazyCancelListingIcon = React.lazy(() =>
  import('./icons').then((module) => ({ default: module.CancelListingIcon })),
)
const LazyListingModalWindowActive = React.lazy(() =>
  import('./icons').then((module) => ({ default: module.ListingModalWindowActive })),
)
const LazyListingModalWindowClosed = React.lazy(() =>
  import('./icons').then((module) => ({ default: module.ListingModalWindowClosed })),
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
const LazySquareOpenSeaMarketplaceIcon = React.lazy(() =>
  import('./icons').then((module) => ({ default: module.SquareOpenSeaMarketplaceIcon })),
)
const LazySquareLooksRareMarketplaceIcon = React.lazy(() =>
  import('./icons').then((module) => ({ default: module.SquareLooksRareMarketplaceIcon })),
)
const LazySquareLooksX2Y2MarketplaceIcon = React.lazy(() =>
  import('./icons').then((module) => ({ default: module.SquareLooksX2Y2MarketplaceIcon })),
)
const LazySquareLooksBlurMarketplaceIcon = React.lazy(() =>
  import('./icons').then((module) => ({ default: module.SquareLooksBlurMarketplaceIcon })),
)
const LazySquareSudoSwapMarketplaceIcon = React.lazy(() =>
  import('./icons').then((module) => ({ default: module.SquareSudoSwapMarketplaceIcon })),
)
const LazySquareNftXMarketplaceIcon = React.lazy(() =>
  import('./icons').then((module) => ({ default: module.SquareNftXMarketplaceIcon })),
)
const LazySquareGemMarketplaceIcon = React.lazy(() =>
  import('./icons').then((module) => ({ default: module.SquareGemMarketplaceIcon })),
)
const LazySquareZoraMarketplaceIcon = React.lazy(() =>
  import('./icons').then((module) => ({ default: module.SquareZoraMarketplaceIcon })),
)
const LazySquareEnsVisionMarketplaceIcon = React.lazy(() =>
  import('./icons').then((module) => ({ default: module.SquareEnsVisionMarketplaceIcon })),
)
const LazySquareCryptopunksMarketplaceIcon = React.lazy(() =>
  import('./icons').then((module) => ({ default: module.SquareCryptopunksMarketplaceIcon })),
)
const LazySquareRaribleMarketplaceIcon = React.lazy(() =>
  import('./icons').then((module) => ({ default: module.SquareRaribleMarketplaceIcon })),
)
const LazySquareFoundationMarketplaceIcon = React.lazy(() =>
  import('./icons').then((module) => ({ default: module.SquareFoundationMarketplaceIcon })),
)
const LazySquareNft20MarketplaceIcon = React.lazy(() =>
  import('./icons').then((module) => ({ default: module.SquareNft20MarketplaceIcon })),
)

export const ChevronUpIcon = forwardRef<SVGSVGElement, Omit<ChevronUpIconProps, 'ref'>>((props, ref) => (
  <LazyIconWrapper ref={ref}>
    <LazyChevronUpIcon {...props} />
  </LazyIconWrapper>
))
ChevronUpIcon.displayName = 'ChevronUpIcon'

export const BackArrowIcon = forwardRef<SVGSVGElement, SVGProps>((props, ref) => (
  <LazyIconWrapper ref={ref}>
    <LazyBackArrowIcon {...props} />
  </LazyIconWrapper>
))
BackArrowIcon.displayName = 'BackArrowIcon'

export const VerifiedIcon = forwardRef<SVGSVGElement, SVGProps>((props, ref) => (
  <LazyIconWrapper ref={ref}>
    <LazyVerifiedIcon {...props} />
  </LazyIconWrapper>
))
VerifiedIcon.displayName = 'VerifiedIcon'

export const XMarkIcon = forwardRef<SVGSVGElement, SVGProps>((props, ref) => (
  <LazyIconWrapper ref={ref}>
    <LazyXMarkIcon {...props} />
  </LazyIconWrapper>
))
XMarkIcon.displayName = 'XMarkIcon'

export const LightningBoltIcon = forwardRef<SVGSVGElement, SVGProps>((props, ref) => (
  <LazyIconWrapper ref={ref}>
    <LazyLightningBoltIcon {...props} />
  </LazyIconWrapper>
))
LightningBoltIcon.displayName = 'LightningBoltIcon'

export const CrossIcon = forwardRef<SVGSVGElement, SVGProps>((props, ref) => (
  <LazyIconWrapper ref={ref}>
    <LazyCrossIcon {...props} />
  </LazyIconWrapper>
))
CrossIcon.displayName = 'CrossIcon'

export const ReversedArrowsIcon = forwardRef<SVGSVGElement, SVGProps & { size?: string }>((props, ref) => (
  <LazyIconWrapper ref={ref}>
    <LazyReversedArrowsIcon {...props} />
  </LazyIconWrapper>
))
ReversedArrowsIcon.displayName = 'ReversedArrowsIcon'

export const BrokenLinkIcon = forwardRef<SVGSVGElement, SVGProps>((props, ref) => (
  <LazyIconWrapper ref={ref}>
    <LazyBrokenLinkIcon {...props} />
  </LazyIconWrapper>
))
BrokenLinkIcon.displayName = 'BrokenLinkIcon'

export const ApprovedCheckmarkIcon = forwardRef<SVGSVGElement, SVGProps>((props, ref) => (
  <LazyIconWrapper ref={ref}>
    <LazyApprovedCheckmarkIcon {...props} />
  </LazyIconWrapper>
))
ApprovedCheckmarkIcon.displayName = 'ApprovedCheckmarkIcon'

export const FilterIcon = forwardRef<SVGSVGElement, SVGProps>((props, ref) => (
  <LazyIconWrapper ref={ref}>
    <LazyFilterIcon {...props} />
  </LazyIconWrapper>
))
FilterIcon.displayName = 'FilterIcon'

export const BagIcon = forwardRef<SVGSVGElement, SVGProps>((props, ref) => (
  <LazyIconWrapper ref={ref}>
    <LazyBagIcon {...props} />
  </LazyIconWrapper>
))
BagIcon.displayName = 'BagIcon'

export const TagIcon = forwardRef<SVGSVGElement, SVGProps>((props, ref) => (
  <LazyIconWrapper ref={ref}>
    <LazyTagIcon {...props} />
  </LazyIconWrapper>
))
TagIcon.displayName = 'TagIcon'

export const TwitterIcon = forwardRef<SVGSVGElement, SVGProps>((props, ref) => (
  <LazyIconWrapper ref={ref}>
    <LazyTwitterIcon {...props} />
  </LazyIconWrapper>
))
TwitterIcon.displayName = 'TwitterIcon'

export const ActivityListingIcon = forwardRef<SVGSVGElement, SVGProps>((props, ref) => (
  <LazyIconWrapper ref={ref}>
    <LazyActivityListingIcon {...props} />
  </LazyIconWrapper>
))
ActivityListingIcon.displayName = 'ActivityListingIcon'

export const ActivitySaleIcon = forwardRef<SVGSVGElement, SVGProps>((props, ref) => (
  <LazyIconWrapper ref={ref}>
    <LazyActivitySaleIcon {...props} />
  </LazyIconWrapper>
))
ActivitySaleIcon.displayName = 'ActivitySaleIcon'

export const ActivityTransferIcon = forwardRef<SVGSVGElement, SVGProps>((props, ref) => (
  <LazyIconWrapper ref={ref}>
    <LazyActivityTransferIcon {...props} />
  </LazyIconWrapper>
))
ActivityTransferIcon.displayName = 'ActivityTransferIcon'

export const ActivityExternalLinkIcon = forwardRef<SVGSVGElement, SVGProps>((props, ref) => (
  <LazyIconWrapper ref={ref}>
    <LazyActivityExternalLinkIcon {...props} />
  </LazyIconWrapper>
))
ActivityExternalLinkIcon.displayName = 'ActivityExternalLinkIcon'

export const LargeTagIcon = forwardRef<SVGSVGElement, SVGProps>((props, ref) => (
  <LazyIconWrapper ref={ref}>
    <LazyLargeTagIcon {...props} />
  </LazyIconWrapper>
))
LargeTagIcon.displayName = 'LargeTagIcon'

export const CircularCloseIcon = forwardRef<SVGSVGElement, SVGProps>((props, ref) => (
  <LazyIconWrapper ref={ref}>
    <LazyCircularCloseIcon {...props} />
  </LazyIconWrapper>
))
CircularCloseIcon.displayName = 'CircularCloseIcon'

export const SquareArrowDownIcon = forwardRef<SVGSVGElement, SVGProps>((props, ref) => (
  <LazyIconWrapper ref={ref}>
    <LazySquareArrowDownIcon {...props} />
  </LazyIconWrapper>
))
SquareArrowDownIcon.displayName = 'SquareArrowDownIcon'

export const SquareArrowUpIcon = forwardRef<SVGSVGElement, SVGProps>((props, ref) => (
  <LazyIconWrapper ref={ref}>
    <LazySquareArrowUpIcon {...props} />
  </LazyIconWrapper>
))
SquareArrowUpIcon.displayName = 'SquareArrowUpIcon'

export const CloseTimerIcon = forwardRef<SVGSVGElement, SVGProps>((props, ref) => (
  <LazyIconWrapper ref={ref}>
    <LazyCloseTimerIcon {...props} />
  </LazyIconWrapper>
))
CloseTimerIcon.displayName = 'CloseTimerIcon'

export const ChevronDownBagIcon = forwardRef<SVGSVGElement, SVGProps>((props, ref) => (
  <LazyIconWrapper ref={ref}>
    <LazyChevronDownBagIcon {...props} />
  </LazyIconWrapper>
))
ChevronDownBagIcon.displayName = 'ChevronDownBagIcon'

export const ChevronUpBagIcon = forwardRef<SVGSVGElement, SVGProps>((props, ref) => (
  <LazyIconWrapper ref={ref}>
    <LazyChevronUpBagIcon {...props} />
  </LazyIconWrapper>
))
ChevronUpBagIcon.displayName = 'ChevronUpBagIcon'

export const BagCloseIcon = forwardRef<SVGSVGElement, SVGProps>((props, ref) => (
  <LazyIconWrapper ref={ref}>
    <LazyBagCloseIcon {...props} />
  </LazyIconWrapper>
))
BagCloseIcon.displayName = 'BagCloseIcon'

export const CancelListingIcon = forwardRef<SVGSVGElement, SVGProps>((props, ref) => (
  <LazyIconWrapper ref={ref}>
    <LazyCancelListingIcon {...props} />
  </LazyIconWrapper>
))
CancelListingIcon.displayName = 'CancelListingIcon'

export const ListingModalWindowActive = forwardRef<SVGSVGElement, SVGProps>((props, ref) => (
  <LazyIconWrapper ref={ref}>
    <LazyListingModalWindowActive {...props} />
  </LazyIconWrapper>
))
ListingModalWindowActive.displayName = 'ListingModalWindowActive'

export const ListingModalWindowClosed = forwardRef<SVGSVGElement, SVGProps>((props, ref) => (
  <LazyIconWrapper ref={ref}>
    <LazyListingModalWindowClosed {...props} />
  </LazyIconWrapper>
))
ListingModalWindowClosed.displayName = 'ListingModalWindowClosed'

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

export const SquareOpenSeaMarketplaceIcon = forwardRef<SVGSVGElement, SVGProps>((props, ref) => (
  <LazyIconWrapper ref={ref}>
    <LazySquareOpenSeaMarketplaceIcon {...props} />
  </LazyIconWrapper>
))
SquareOpenSeaMarketplaceIcon.displayName = 'SquareOpenSeaMarketplaceIcon'

export const SquareLooksRareMarketplaceIcon = forwardRef<SVGSVGElement, SVGProps>((props, ref) => (
  <LazyIconWrapper ref={ref}>
    <LazySquareLooksRareMarketplaceIcon {...props} />
  </LazyIconWrapper>
))
SquareLooksRareMarketplaceIcon.displayName = 'SquareLooksRareMarketplaceIcon'

export const SquareLooksX2Y2MarketplaceIcon = forwardRef<SVGSVGElement, SVGProps>(({ gradientId, ...props }, ref) => (
  <LazyIconWrapper ref={ref}>
    <LazySquareLooksX2Y2MarketplaceIcon gradientId={gradientId} {...props} />
  </LazyIconWrapper>
))
SquareLooksX2Y2MarketplaceIcon.displayName = 'SquareLooksX2Y2MarketplaceIcon'

export const SquareLooksBlurMarketplaceIcon = forwardRef<SVGSVGElement, SVGProps>((props, ref) => (
  <LazyIconWrapper ref={ref}>
    <LazySquareLooksBlurMarketplaceIcon {...props} />
  </LazyIconWrapper>
))
SquareLooksBlurMarketplaceIcon.displayName = 'SquareLooksBlurMarketplaceIcon'

export const SquareSudoSwapMarketplaceIcon = forwardRef<SVGSVGElement, SVGProps>((props, ref) => (
  <LazyIconWrapper ref={ref}>
    <LazySquareSudoSwapMarketplaceIcon {...props} />
  </LazyIconWrapper>
))
SquareSudoSwapMarketplaceIcon.displayName = 'SquareSudoSwapMarketplaceIcon'

export const SquareNftXMarketplaceIcon = forwardRef<SVGSVGElement, SVGProps>(({ gradientId, ...props }, ref) => (
  <LazyIconWrapper ref={ref}>
    <LazySquareNftXMarketplaceIcon gradientId={gradientId} {...props} />
  </LazyIconWrapper>
))
SquareNftXMarketplaceIcon.displayName = 'SquareNftXMarketplaceIcon'

export const SquareGemMarketplaceIcon = forwardRef<SVGSVGElement, SVGProps>(({ gradientId, ...props }, ref) => (
  <LazyIconWrapper ref={ref}>
    <LazySquareGemMarketplaceIcon gradientId={gradientId} {...props} />
  </LazyIconWrapper>
))
SquareGemMarketplaceIcon.displayName = 'SquareGemMarketplaceIcon'

export const SquareZoraMarketplaceIcon = forwardRef<SVGSVGElement, SVGProps>(({ gradientId, ...props }, ref) => (
  <LazyIconWrapper ref={ref}>
    <LazySquareZoraMarketplaceIcon gradientId={gradientId} {...props} />
  </LazyIconWrapper>
))
SquareZoraMarketplaceIcon.displayName = 'SquareZoraMarketplaceIcon'

export const SquareEnsVisionMarketplaceIcon = forwardRef<SVGSVGElement, SVGProps>(({ gradientId, ...props }, ref) => (
  <LazyIconWrapper ref={ref}>
    <LazySquareEnsVisionMarketplaceIcon gradientId={gradientId} {...props} />
  </LazyIconWrapper>
))
SquareEnsVisionMarketplaceIcon.displayName = 'SquareEnsVisionMarketplaceIcon'

export const SquareCryptopunksMarketplaceIcon = forwardRef<SVGSVGElement, SVGProps>((props, ref) => (
  <LazyIconWrapper ref={ref}>
    <LazySquareCryptopunksMarketplaceIcon {...props} />
  </LazyIconWrapper>
))
SquareCryptopunksMarketplaceIcon.displayName = 'SquareCryptopunksMarketplaceIcon'

export const SquareRaribleMarketplaceIcon = forwardRef<SVGSVGElement, SVGProps>((props, ref) => (
  <LazyIconWrapper ref={ref}>
    <LazySquareRaribleMarketplaceIcon {...props} />
  </LazyIconWrapper>
))
SquareRaribleMarketplaceIcon.displayName = 'SquareRaribleMarketplaceIcon'

export const SquareFoundationMarketplaceIcon = forwardRef<SVGSVGElement, SVGProps>((props, ref) => (
  <LazyIconWrapper ref={ref}>
    <LazySquareFoundationMarketplaceIcon {...props} />
  </LazyIconWrapper>
))
SquareFoundationMarketplaceIcon.displayName = 'SquareFoundationMarketplaceIcon'

export const SquareNft20MarketplaceIcon = forwardRef<SVGSVGElement, SVGProps>((props, ref) => (
  <LazyIconWrapper ref={ref}>
    <LazySquareNft20MarketplaceIcon {...props} />
  </LazyIconWrapper>
))
SquareNft20MarketplaceIcon.displayName = 'SquareNft20MarketplaceIcon'
