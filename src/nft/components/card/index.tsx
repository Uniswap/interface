import * as Card from 'nft/components/card/containers'
import { MarketplaceContainer } from 'nft/components/card/icons'
import { MediaContainer } from 'nft/components/card/media'
import { detailsHref, getNftDisplayComponent, useSelectAsset } from 'nft/components/card/utils'
import { useBag } from 'nft/hooks'
import { GenieAsset, UniformAspectRatio, UniformAspectRatios, WalletAsset } from 'nft/types'
import { ReactNode } from 'react'
import { NumberType, useFormatter } from 'utils/formatNumbers'

interface NftCardProps {
  asset: GenieAsset | WalletAsset
  display: NftCardDisplayProps
  isSelected: boolean
  isDisabled: boolean
  selectAsset?: () => void
  unselectAsset?: () => void
  onButtonClick?: () => void
  onCardClick?: () => void
  sendAnalyticsEvent?: () => void
  mediaShouldBePlaying: boolean
  uniformAspectRatio?: UniformAspectRatio
  setUniformAspectRatio?: (uniformAspectRatio: UniformAspectRatio) => void
  renderedHeight?: number
  setRenderedHeight?: (renderedHeight: number | undefined) => void
  setCurrentTokenPlayingMedia: (tokenId: string | undefined) => void
  testId?: string
  hideDetails?: boolean
}

export interface NftCardDisplayProps {
  primaryInfo?: ReactNode
  primaryInfoIcon?: ReactNode
  primaryInfoRight?: ReactNode
  secondaryInfo?: ReactNode
  selectedInfo?: ReactNode
  notSelectedInfo?: ReactNode
  disabledInfo?: ReactNode
}

/**
 * NftCard is a component that displays an NFT asset.
 *
 * By default, clicking on the card will navigate to the details page.
 * If you wish to override this behavior, pass a value for the onCardClick prop.
 */
export const NftCard = ({
  asset,
  display,
  isSelected,
  selectAsset,
  unselectAsset,
  isDisabled,
  onButtonClick,
  onCardClick,
  sendAnalyticsEvent,
  mediaShouldBePlaying,
  uniformAspectRatio = UniformAspectRatios.square,
  setUniformAspectRatio,
  renderedHeight,
  setRenderedHeight,
  setCurrentTokenPlayingMedia,
  testId,
  hideDetails = false,
}: NftCardProps) => {
  const clickActionButton = useSelectAsset({
    selectAsset,
    unselectAsset,
    isSelected,
    isDisabled,
    onClick: onButtonClick,
  })
  const { bagExpanded, setBagExpanded } = useBag((state) => ({
    bagExpanded: state.bagExpanded,
    setBagExpanded: state.setBagExpanded,
  }))

  const { formatNumberOrString } = useFormatter()
  const collectionNft = 'marketplace' in asset
  const profileNft = 'asset_contract' in asset
  const tokenType = collectionNft ? asset.tokenType : profileNft ? asset.asset_contract.tokenType : undefined
  const marketplace = collectionNft ? asset.marketplace : undefined
  const listedPrice =
    profileNft && !isDisabled && asset.floor_sell_order_price
      ? formatNumberOrString({ input: asset.floor_sell_order_price, type: NumberType.NFTTokenFloorPrice })
      : undefined

  return (
    <Card.Container
      isSelected={isSelected}
      isDisabled={isDisabled}
      detailsHref={onCardClick ? undefined : detailsHref(asset)}
      testId={testId}
      onClick={() => {
        if (bagExpanded) setBagExpanded({ bagExpanded: false })
        onCardClick?.()
        sendAnalyticsEvent?.()
      }}
    >
      <MediaContainer isDisabled={isDisabled}>
        <MarketplaceContainer
          hidePrice={hideDetails}
          isSelected={isSelected}
          marketplace={marketplace}
          tokenType={tokenType}
          listedPrice={listedPrice}
        />
        {getNftDisplayComponent(
          asset,
          mediaShouldBePlaying,
          setCurrentTokenPlayingMedia,
          uniformAspectRatio,
          setUniformAspectRatio,
          renderedHeight,
          setRenderedHeight
        )}
      </MediaContainer>
      {!hideDetails && (
        <>
          <Card.DetailsRelativeContainer>
            <Card.DetailsContainer>
              <Card.InfoContainer>
                <Card.PrimaryRow>
                  <Card.PrimaryDetails>
                    <Card.PrimaryInfo>{display.primaryInfo}</Card.PrimaryInfo>
                    {display.primaryInfoIcon}
                  </Card.PrimaryDetails>
                  {display.primaryInfoRight}
                </Card.PrimaryRow>
                <Card.SecondaryRow>
                  <Card.SecondaryDetails>
                    <Card.SecondaryInfo>{display.secondaryInfo}</Card.SecondaryInfo>
                  </Card.SecondaryDetails>
                </Card.SecondaryRow>
              </Card.InfoContainer>
            </Card.DetailsContainer>
          </Card.DetailsRelativeContainer>
          <Card.ActionButton clickActionButton={clickActionButton} isDisabled={isDisabled} isSelected={isSelected}>
            {isSelected ? display.selectedInfo : isDisabled ? display.disabledInfo : display.notSelectedInfo}
          </Card.ActionButton>
        </>
      )}
    </Card.Container>
  )
}
