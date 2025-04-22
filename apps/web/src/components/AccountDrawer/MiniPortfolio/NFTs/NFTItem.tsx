import { InterfaceElementName, SharedEventName } from '@uniswap/analytics-events'
import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { MouseFollowTooltip, TooltipSize } from 'components/Tooltip'
import { NftCard } from 'nft/components/card'
import { detailsHref } from 'nft/components/card/utils'
import { VerifiedIcon } from 'nft/components/icons'
import { WalletAsset } from 'nft/types'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ThemedText } from 'theme/components'
import { capitalize } from 'tsafe'
import { Flex, Text } from 'ui/src'
import { Chain } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { GqlChainId } from 'uniswap/src/features/chains/types'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { NumberType, useFormatter } from 'utils/formatNumbers'

export function NFT({
  asset,
  mediaShouldBePlaying,
  setCurrentTokenPlayingMedia,
}: {
  asset: WalletAsset
  mediaShouldBePlaying: boolean
  setCurrentTokenPlayingMedia: (tokenId: string | undefined) => void
}) {
  const { t } = useTranslation()
  const { isTestnetModeEnabled, gqlChains } = useEnabledChains()
  const accountDrawer = useAccountDrawer()
  const navigate = useNavigate()
  const trace = useTrace()
  const [isHovered, setIsHovered] = useState(false)

  const enabled =
    asset.chain && isTestnetModeEnabled ? gqlChains.includes(asset.chain as GqlChainId) : asset.chain === Chain.Ethereum

  const navigateToNFTDetails = () => {
    if (enabled) {
      accountDrawer.close()
      navigate(detailsHref(asset))
    }
  }

  return (
    <Flex
      gap="8px"
      minHeight="150px"
      alignItems="center"
      justifyContent="flex-start"
      width="100%"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <MouseFollowTooltip
        placement="bottom"
        size={TooltipSize.Max}
        disabled={enabled}
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
          isDisabled={!enabled}
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
      <NFTDetails asset={asset} isHovered={isHovered} />
    </Flex>
  )
}

function NFTDetails({ asset, isHovered }: { asset: WalletAsset; isHovered: boolean }) {
  const { formatNumberOrString } = useFormatter()

  return (
    <Flex overflow="hidden" width="100%" flexWrap="nowrap">
      <Flex row alignItems="center" gap="4px" width="100%">
        <Text
          variant="body3"
          mx="$spacing2"
          maxWidth="calc(100% - 22px)"
          $platform-web={{ whiteSpace: 'pre', textOverflow: 'ellipsis', overflow: 'hidden' }}
        >
          {asset.asset_contract.name}
        </Text>
        {asset.collectionIsVerified && <Verified />}
      </Flex>
      <Flex
        opacity={isHovered ? 1 : 0}
        row
        $platform-web={{ whiteSpace: 'pre' }}
        alignItems="center"
        justifyContent="flex-start"
        width="100%"
      >
        <ThemedText.BodySmall color="neutral2">
          {asset.floorPrice
            ? `${formatNumberOrString({ input: asset.floorPrice, type: NumberType.NFTTokenFloorPrice })} ETH`
            : ' '}
        </ThemedText.BodySmall>
      </Flex>
    </Flex>
  )
}

const BADGE_SIZE = '18px'
function Verified() {
  return (
    <Flex row alignItems="center" width="unset" style={{ flexShrink: 0 }}>
      <VerifiedIcon height={BADGE_SIZE} width={BADGE_SIZE} />
    </Flex>
  )
}
