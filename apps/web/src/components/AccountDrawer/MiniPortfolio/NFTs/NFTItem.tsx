import { InterfaceElementName, SharedEventName } from '@uniswap/analytics-events'
import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import Column from 'components/Column'
import Row from 'components/Row'
import { MouseFollowTooltip, TooltipSize } from 'components/Tooltip'
import { t } from 'i18next'
import styled from 'lib/styled-components'
import { Box } from 'nft/components/Box'
import { NftCard } from 'nft/components/card'
import { detailsHref } from 'nft/components/card/utils'
import { VerifiedIcon } from 'nft/components/icons'
import { WalletAsset } from 'nft/types'
import { useNavigate } from 'react-router-dom'
import { ThemedText } from 'theme/components'
import { capitalize } from 'tsafe'
import { Chain } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { NumberType, useFormatter } from 'utils/formatNumbers'

const FloorPrice = styled(Row)`
  opacity: 0;

  // prevent empty whitespace from collapsing line height to maintain
  // consistent spacing below rows
  white-space: pre;
`

const NFTContainer = styled(Column)`
  gap: 8px;
  min-height: 150px;

  &:hover {
    ${FloorPrice} {
      opacity: 1;
    }
  }
`
const NFTCollectionName = styled(ThemedText.BodySmall)`
  white-space: pre;
  text-overflow: ellipsis;
  overflow: hidden;
`

export function NFT({
  asset,
  mediaShouldBePlaying,
  setCurrentTokenPlayingMedia,
}: {
  asset: WalletAsset
  mediaShouldBePlaying: boolean
  setCurrentTokenPlayingMedia: (tokenId: string | undefined) => void
}) {
  const accountDrawer = useAccountDrawer()
  const navigate = useNavigate()
  const trace = useTrace()

  const navigateToNFTDetails = () => {
    if (asset.chain === Chain.Ethereum) {
      accountDrawer.close()
      navigate(detailsHref(asset))
    }
  }

  return (
    <NFTContainer>
      <MouseFollowTooltip
        placement="bottom"
        size={TooltipSize.Max}
        disabled={asset.chain === Chain.Ethereum}
        text={t('nft.chainSupportComingSoon', {
          chainName: capitalize(asset.chain?.toLowerCase() ?? 'L2'),
        })}
        hideArrow
      >
        <NftCard
          asset={asset}
          hideDetails
          display={{ disabledInfo: true }}
          isSelected={false}
          isDisabled={asset.chain !== Chain.Ethereum}
          onCardClick={navigateToNFTDetails}
          sendAnalyticsEvent={() =>
            sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
              element: InterfaceElementName.MINI_PORTFOLIO_NFT_ITEM,
              collection_name: asset.collection?.name,
              collection_address: asset.collection?.address,
              token_id: asset.tokenId,
              ...trace,
            })
          }
          mediaShouldBePlaying={mediaShouldBePlaying}
          setCurrentTokenPlayingMedia={setCurrentTokenPlayingMedia}
          testId="mini-portfolio-nft"
        />
      </MouseFollowTooltip>
      <NFTDetails asset={asset} />
    </NFTContainer>
  )
}

function NFTDetails({ asset }: { asset: WalletAsset }) {
  const { formatNumberOrString } = useFormatter()

  return (
    <Box overflow="hidden" width="full" flexWrap="nowrap">
      <Row gap="4px">
        <NFTCollectionName>{asset.asset_contract.name}</NFTCollectionName>
        {asset.collectionIsVerified && <Verified />}
      </Row>
      <FloorPrice>
        <ThemedText.BodySmall color="neutral2">
          {asset.floorPrice
            ? `${formatNumberOrString({ input: asset.floorPrice, type: NumberType.NFTTokenFloorPrice })} ETH`
            : ' '}
        </ThemedText.BodySmall>
      </FloorPrice>
    </Box>
  )
}

const BADGE_SIZE = '18px'
function Verified() {
  return (
    <Row width="unset" style={{ flexShrink: 0 }}>
      <VerifiedIcon height={BADGE_SIZE} width={BADGE_SIZE} />
    </Row>
  )
}
