import { useWeb3React } from '@web3-react/core'
import clsx from 'clsx'
import { MouseoverTooltip } from 'components/Tooltip/index'
import useENSName from 'hooks/useENSName'
import { AnimatedBox, Box } from 'nft/components/Box'
import { CollectionProfile } from 'nft/components/details/CollectionProfile'
import { Details } from 'nft/components/details/Details'
import { Traits } from 'nft/components/details/Traits'
import { Center, Column, Row } from 'nft/components/Flex'
import { CloseDropDownIcon, CornerDownLeftIcon, Eth2Icon, ShareIcon, SuspiciousIcon } from 'nft/components/icons'
import { ExpandableText } from 'nft/components/layout/ExpandableText'
import { badge, bodySmall, caption, headlineMedium, subhead } from 'nft/css/common.css'
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

import * as styles from './AssetDetails.css'

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

const formatter = Intl.DateTimeFormat('en-GB', { dateStyle: 'full', timeStyle: 'short' })

const CountdownTimer = ({ sellOrder }: { sellOrder: SellOrder }) => {
  const { date, expires } = useMemo(() => {
    const date = new Date(sellOrder.orderClosingDate)
    return {
      date,
      expires: formatter.format(date),
    }
  }, [sellOrder])
  const [days, hours, minutes, seconds] = useTimeout(date)

  return (
    <MouseoverTooltip text={<Box fontSize="12">Expires {expires}</Box>}>
      <Box as="span" fontWeight="normal" className={caption} color="textSecondary">
        Expires: {days !== 0 ? `${days} days` : ''} {hours !== 0 ? `${hours} hours` : ''} {minutes} minutes {seconds}{' '}
        seconds
      </Box>
    </MouseoverTooltip>
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

  useEffect(() => {
    if (asset.creator) setCreatorAddress(asset.creator.address)
    if (asset.owner) setOwnerAddress(asset.owner)
  }, [asset])

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

  return (
    <AnimatedBox
      style={{
        // @ts-ignore
        width: gridWidthOffset.to((x) => `calc(100% - ${x}px)`),
      }}
      className={styles.container}
    >
      <div className={styles.columns}>
        <Column className={styles.column}>
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
        </Column>
        <Column className={clsx(styles.column, styles.columnRight)} width="full">
          <Column>
            <Row
              marginBottom="8"
              alignItems="center"
              textAlign="center"
              justifyContent={rarityProvider ? 'space-between' : 'flex-end'}
            >
              {rarityProvider && (
                <MouseoverTooltip
                  text={
                    <Row gap="4">
                      <img src={rarityLogo} width={16} alt={rarityProvider.provider} />
                      Ranking by{' '}
                      {asset.rarity?.primaryProvider === 'Genie' ? fallbackProvider : asset.rarity?.primaryProvider}
                    </Row>
                  }
                >
                  <Center
                    paddingLeft="6"
                    paddingRight="4"
                    className={badge}
                    backgroundColor="backgroundSurface"
                    color="textPrimary"
                    borderRadius="4"
                  >
                    #{rarityProvider.rank} <img src="/nft/svgs/rarity.svg" height={15} width={15} alt="Rarity rank" />
                  </Center>
                </MouseoverTooltip>
              )}
              <Row gap="12">
                <Center
                  as="button"
                  padding="0"
                  border="none"
                  background="transparent"
                  cursor="pointer"
                  onClick={async () => {
                    await navigator.clipboard.writeText(`${window.location.hostname}/#${pathname}`)
                  }}
                >
                  <ShareIcon />
                </Center>

                <Center
                  as="button"
                  border="none"
                  width="32"
                  height="32"
                  padding="0"
                  background="transparent"
                  cursor="pointer"
                  onClick={() => {
                    if (!parsed.origin || parsed.origin === 'collection') {
                      navigate(`/nfts/collection/${asset.address}`)
                    } else if (parsed.origin === 'profile') {
                      navigate('/profile', undefined)
                    } else if (parsed.origin === 'explore') {
                      navigate(`/nfts`, undefined)
                    } else if (parsed.origin === 'activity') {
                      navigate(`/nfts/collection/${asset.address}/activity`, undefined)
                    }
                  }}
                >
                  {parsed.origin ? (
                    <CornerDownLeftIcon width="28" height="28" />
                  ) : (
                    <CloseDropDownIcon color={themeVars.colors.textSecondary} />
                  )}
                </Center>
              </Row>
            </Row>
            <Row as="h1" marginTop="0" marginBottom="12" gap="2" className={headlineMedium}>
              {asset.openseaSusFlag && (
                <Box marginTop="8">
                  <MouseoverTooltip text={<Box fontWeight="normal">Reported for suspicious activity on OpenSea</Box>}>
                    <SuspiciousIcon height="30" width="30" viewBox="0 0 16 17" />
                  </MouseoverTooltip>
                </Box>
              )}

              {asset.name || `${collection.collectionName} #${asset.tokenId}`}
            </Row>
            {collection.collectionDescription ? (
              <ExpandableText>
                <ReactMarkdown
                  allowedTypes={['link', 'paragraph', 'strong', 'code', 'emphasis', 'text']}
                  source={collection.collectionDescription}
                />
              </ExpandableText>
            ) : null}
            <Row
              justifyContent={{
                sm: 'space-between',
              }}
              gap={{
                sm: 'unset',
              }}
              marginBottom="36"
            >
              {ownerAddress.length > 0 && (
                <a
                  target="_blank"
                  rel="noreferrer"
                  href={`https://etherscan.io/address/${asset.owner}`}
                  style={{ textDecoration: 'none' }}
                >
                  <CollectionProfile
                    label="Owner"
                    avatarUrl=""
                    name={ownerEnsName.ENSName ?? shortenAddress(ownerAddress, 0, 4)}
                  />
                </a>
              )}

              <Link to={`/nfts/collection/${asset.address}`} style={{ textDecoration: 'none' }}>
                <CollectionProfile
                  label="Collection"
                  avatarUrl={collection.collectionImageUrl}
                  name={collection.collectionName}
                  isVerified={collection.isVerified}
                />
              </Link>

              {creatorAddress ? (
                <a
                  target="_blank"
                  rel="noreferrer"
                  href={`https://etherscan.io/address/${creatorAddress}`}
                  style={{ textDecoration: 'none' }}
                >
                  <CollectionProfile
                    label="Creator"
                    avatarUrl={asset.creator.profile_img_url}
                    name={creatorEnsName.ENSName ?? shortenAddress(creatorAddress, 0, 4)}
                    isVerified
                    className={styles.creator}
                  />
                </a>
              ) : null}
            </Row>
          </Column>

          {asset.priceInfo && !isOwned ? (
            <Row
              marginTop="8"
              marginBottom="40"
              justifyContent="space-between"
              borderRadius="12"
              paddingTop="16"
              paddingBottom="16"
              paddingLeft="16"
              paddingRight="24"
              background="accentActiveSoft"
            >
              <Column justifyContent="flex-start" gap="8">
                <Row gap="12" as="a" target="_blank" rel="norefferer">
                  <a href={asset.sellorders[0].marketplaceUrl} rel="noreferrer" target="_blank">
                    <img
                      className={styles.marketplace}
                      src={`/nft/svgs/marketplaces/${asset.sellorders[0].marketplace}.svg`}
                      height={16}
                      width={16}
                      alt="Markeplace"
                    />
                  </a>
                  <Row as="span" className={subhead} color="textPrimary">
                    {formatEthPrice(asset.priceInfo.ETHPrice)} <Eth2Icon />
                  </Row>
                  <Box as="span" color="textSecondary" className={bodySmall}>
                    ${toSignificant(asset.priceInfo.USDPrice)}
                  </Box>
                </Row>
                {asset.sellorders?.[0].orderClosingDate ? <CountdownTimer sellOrder={asset.sellorders[0]} /> : null}
              </Column>
              <Box
                as="button"
                paddingTop="14"
                paddingBottom="14"
                fontWeight="medium"
                textAlign="center"
                fontSize="14"
                style={{ width: '244px' }}
                color={isSelected ? 'genieBlue' : 'explicitWhite'}
                border="none"
                borderRadius="12"
                background={isSelected ? 'explicitWhite' : 'genieBlue'}
                transition="250"
                boxShadow={{ hover: 'elevation' }}
                onClick={() => {
                  if (isSelected) {
                    removeAssetFromBag(asset)
                  } else addAssetToBag(asset)
                  setSelected((x) => !x)
                }}
              >
                {isSelected ? 'Added to Bag' : 'Buy Now'}
              </Box>
            </Row>
          ) : null}
          <Row gap="32" marginBottom="20">
            <button data-active={showTraits} onClick={() => setShowTraits(true)} className={styles.tab}>
              Traits
            </button>
            <button data-active={!showTraits} onClick={() => setShowTraits(false)} className={styles.tab}>
              Details
            </button>
          </Row>
          {showTraits ? (
            <Traits collectionAddress={asset.address} traits={asset.traits ?? []} />
          ) : (
            <Details
              contractAddress={asset.address}
              tokenId={asset.tokenId}
              tokenType={asset.tokenType}
              blockchain="Ethereum"
              metadataUrl={asset.externalLink}
              totalSupply={collection.totalSupply}
            />
          )}
        </Column>
      </div>
    </AnimatedBox>
  )
}
