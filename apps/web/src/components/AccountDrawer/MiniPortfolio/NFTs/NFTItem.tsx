import { InterfaceElementName, SharedEventName } from '@uniswap/analytics-events'
import { MouseFollowTooltip, TooltipSize } from 'components/Tooltip'
import { NftCard } from 'nft/components/card'
import { VerifiedIcon } from 'nft/components/iconExports'
import { WalletAsset } from 'nft/types'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { capitalize } from 'tsafe'
import { Flex, Text } from 'ui/src'
import { ExternalLink } from 'ui/src/components/icons/ExternalLink'
import { Chain } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { GqlChainId } from 'uniswap/src/features/chains/types'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'

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
  const trace = useTrace()
  const [isHovered, setIsHovered] = useState(false)

  const enabled =
    asset.chain && isTestnetModeEnabled ? gqlChains.includes(asset.chain as GqlChainId) : asset.chain === Chain.Ethereum

  const onPress = () => {
    if (asset.asset_contract?.address && asset.tokenId) {
      window.open(
        `https://opensea.io/assets/${asset.asset_contract.address}/${asset.tokenId}`,
        '_blank',
        'noopener,noreferrer',
      )
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
          onCardClick={onPress}
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
  const { t } = useTranslation()

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
        alignItems="center"
        justifyContent="flex-start"
        width="100%"
        gap="$spacing4"
      >
        <Text color="$neutral2" variant="body4">
          {t('common.opensea.link')}
        </Text>
        <ExternalLink color="$neutral2" size="$icon.12" />
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
