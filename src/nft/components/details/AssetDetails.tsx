import { useWeb3React } from '@web3-react/core'
import clsx from 'clsx'
import { MouseoverTooltip } from 'components/Tooltip/index'
import useENSName from 'hooks/useENSName'
import { AnimatedBox, Box } from 'nft/components/Box'
import { CollectionProfile } from 'nft/components/details/CollectionProfile'
import { Details } from 'nft/components/details/Details'
import { Traits } from 'nft/components/details/Traits'
import { CloseDropDownIcon, CornerDownLeftIcon, Eth2Icon, ShareIcon, SuspiciousIcon } from 'nft/components/icons'
import { ExpandableText } from 'nft/components/layout/ExpandableText'
import { badge, bodySmall, buttonTextMedium, caption, headlineMedium, subhead } from 'nft/css/common.css'
import { themeVars } from 'nft/css/sprinkles.css'
import { useBag } from 'nft/hooks'
import { useTimeout } from 'nft/hooks/useTimeout'
import { CollectionInfoForAsset, GenieAsset, SellOrder } from 'nft/types'
import { shortenAddress } from 'nft/utils/address'
import { formatEthPrice } from 'nft/utils/currency'
import { isAssetOwnedByUser } from 'nft/utils/isAssetOwnedByUser'
import { isAudio } from 'nft/utils/isAudio'
import { isVideo } from 'nft/utils/isVideo'
import { fallbackProvider, rarityProviderLogo } from 'nft/utils/rarity'
import { toSignificant } from 'nft/utils/toSignificant'
import qs from 'query-string'
import { useEffect, useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useSpring } from 'react-spring'
import { VerifiedIcon } from '../icons'
import styled from 'styled-components/macro'
import InfoContainer from './InfoContainer'
import TraitsContainer from './TraitsContainer'
import rarityIcon from './rarity.svg'
import DetailsContainer from './DetailsContainer'

import * as styles from './AssetDetails.css'
import { description } from '../collection/CollectionStats.css'

const CollectionHeader = styled.div`
  display: flex;
  align-items: center;
  font-size: 16px;
  line-height: 24px;
  color: ${({ theme }) => theme.textPrimary};
`

const AssetHeader = styled.div`
  display: flex;
  align-items: center;
  font-size: 36px;
  line-height: 36px;
  color: ${({ theme }) => theme.textPrimary};
`

const MediaContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 40px;
  margin-bottom: 28px;
`

const Column = styled.div`
  display: flex;
  flex-direction: column;
  margin-left: 116px;
  width: 100%;
`

const AddressText = styled.span`
  font-weight: 600;
  color: ${({ theme }) => theme.textTertiary};
  font-size: 16px;
  line-height: 20px;
`

const DescriptionText = styled.div`
  margin-top: 8px;
  font-size: 14px;
  line-height: 20px;
`

const AudioPlayer = ({
  imageUrl,
  animationUrl,
  name,
  collectionName,
  dominantColor,
}: GenieAsset & { dominantColor: [number, number, number] }) => {
  return (
    <Box position="relative" display="inline-block" alignSelf="center">
      <Box as="audio" className={styles.audioControls} width="292" controls src={animationUrl} />
      <img
        className={styles.image}
        src={imageUrl}
        alt={name || collectionName}
        style={{
          ['--shadow' as string]: `rgba(${dominantColor.join(', ')}, 0.5)`,
          minWidth: '300px',
          minHeight: '300px',
        }}
      />
    </Box>
  )
}

const AssetView = ({
  mediaType,
  asset,
  dominantColor,
}: {
  mediaType: 'image' | 'video' | 'audio'
  asset: GenieAsset
  dominantColor: [number, number, number]
}) => {
  const style = { ['--shadow' as string]: `rgba(${dominantColor.join(', ')}, 0.5)` }

  switch (mediaType) {
    case 'video':
      return <video src={asset.animationUrl} className={styles.image} autoPlay controls muted loop style={style} />
    case 'image':
      return (
        <img className={styles.image} src={asset.imageUrl} alt={asset.name || asset.collectionName} style={style} />
      )
    case 'audio':
      return <AudioPlayer {...asset} dominantColor={dominantColor} />
  }
}

enum MediaType {
  Audio = 'audio',
  Video = 'video',
  Image = 'image',
}

interface AssetDetailsProps {
  asset: GenieAsset
  collection: CollectionInfoForAsset
}

export const AssetDetails = ({ asset, collection }: AssetDetailsProps) => {
  const { pathname, search } = useLocation()
  const navigate = useNavigate()
  const addAssetToBag = useBag((state) => state.addAssetToBag)
  const removeAssetFromBag = useBag((state) => state.removeAssetFromBag)
  const itemsInBag = useBag((state) => state.itemsInBag)
  const bagExpanded = useBag((state) => state.bagExpanded)
  const [creatorAddress, setCreatorAddress] = useState('')
  const [ownerAddress, setOwnerAddress] = useState('')
  const [dominantColor] = useState<[number, number, number]>([0, 0, 0])
  const creatorEnsName = useENSName(creatorAddress)
  const ownerEnsName = useENSName(ownerAddress)
  const parsed = qs.parse(search)
  const { gridWidthOffset } = useSpring({
    gridWidthOffset: bagExpanded ? 324 : 0,
  })
  const [showTraits, setShowTraits] = useState(true)
  const [isSelected, setSelected] = useState(false)
  const [isOwned, setIsOwned] = useState(false)
  const { account: address, provider } = useWeb3React()

  const { rarityProvider, rarityLogo } = useMemo(
    () =>
      asset.rarity
        ? {
            rarityProvider: asset.rarity.providers.find(
              ({ provider: _provider }) => _provider === asset.rarity?.primaryProvider
            ),
            rarityLogo: rarityProviderLogo[asset.rarity.primaryProvider] || '',
          }
        : {},
    [asset.rarity]
  )

  const assetMediaType = useMemo(() => {
    if (isAudio(asset.animationUrl)) {
      return MediaType.Audio
    } else if (isVideo(asset.animationUrl)) {
      return MediaType.Video
    }
    return MediaType.Image
  }, [asset])

  // useEffect(() => {
  //   if (asset.creator) setCreatorAddress(asset.creator.address)
  //   if (asset.owner) setOwnerAddress(asset.owner)
  // }, [asset])

  useEffect(() => {
    setSelected(
      !!itemsInBag.find((item) => item.asset.tokenId === asset.tokenId && item.asset.address === asset.address)
    )
  }, [asset, itemsInBag])

  useEffect(() => {
    if (provider) {
      isAssetOwnedByUser({
        tokenId: asset.tokenId,
        userAddress: address || '',
        assetAddress: asset.address,
        tokenType: asset.tokenType,
        provider,
      }).then(setIsOwned)
    }
  }, [asset, address, provider])

  // console.log(asset)
  // console.log(collection)

  return (
    <Column>
      <CollectionHeader>
        {collection.collectionName} {collection.isVerified && <VerifiedIcon />}
      </CollectionHeader>
      <AssetHeader>{asset.name ? asset.name : `${asset.collectionName} #${asset.tokenId}`}</AssetHeader>
      <MediaContainer>
        {assetMediaType === MediaType.Image ? (
          <img
            className={styles.image}
            src={asset.imageUrl}
            alt={asset.name || collection.collectionName}
            style={{ ['--shadow' as string]: `rgba(${dominantColor.join(', ')}, 0.5)` }}
          />
        ) : (
          <AssetView asset={asset} mediaType={assetMediaType} dominantColor={dominantColor} />
        )}
      </MediaContainer>

      <InfoContainer
        primaryHeader="Traits"
        secondaryHeader={
          rarityProvider ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              Rarity <img src={rarityIcon} width={16} alt={rarityProvider.provider} />
            </span>
          ) : null
        }
      >
        <TraitsContainer asset={asset} collection={collection} />
      </InfoContainer>
      {/* <InfoContainer primaryHeader="Activity" secondaryHeader={null}>
        <TraitsContainer asset={asset} collection={collection} />
      </InfoContainer> */}
      <InfoContainer primaryHeader="Description" secondaryHeader={null}>
        <>
          <div>
            By: <AddressText className={buttonTextMedium}>{shortenAddress(asset.creator)}</AddressText>
          </div>
          <DescriptionText>{collection.collectionDescription}</DescriptionText>
        </>
      </InfoContainer>
      <InfoContainer primaryHeader="Details" secondaryHeader={null}>
        <>
          <DetailsContainer asset={asset} collection={collection} />
        </>
      </InfoContainer>
    </Column>
  )
}
