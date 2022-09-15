<<<<<<< HEAD
import { useSpring } from '@react-spring/web'
=======
>>>>>>> main
import clsx from 'clsx'
import useENSName from 'hooks/useENSName'
import qs from 'query-string'
import { useEffect, useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { useQuery } from 'react-query'
<<<<<<< HEAD
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useWeb3React } from '@web3-react/core'

import AssetToolTip from '../../components/badge/AssetToolTip'
=======
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useSpring } from 'react-spring/web'

>>>>>>> main
import { AnimatedBox, Box } from '../../components/Box'
import { CollectionProfile } from '../../components/details/CollectionProfile'
import { Details } from '../../components/details/Details'
import { Traits } from '../../components/details/Traits'
import { Center, Column, Row } from '../../components/Flex'
<<<<<<< HEAD
import { CloseDropDownIcon, CornerDownLeftIcon, Eth2Icon, ShareIcon, SuspiciousIcon } from '../../components/icons'
import { ExpandableText } from '../../components/layout/ExpandableText'
import { Panel, Tab, Tabs } from '../../components/layout/Tabs'
import { bodySmall, caption, header2, badge, subhead } from '../../css/common.css'
import { themeVars } from '../../css/sprinkles.css'
import { useBag } from '../../hooks'
import { fetchSingleAsset } from '../../queries'
import { CollectionInfoForAsset, GenieAsset, SellOrder } from '../../types'
import { shortenAddress } from '../../utils/address'
import { isAudio } from '../../utils/isAudio'
import { isVideo } from '../../utils/isVideo'
import { fallbackProvider, rarityProviderLogo } from '../../utils/rarity'
import * as styles from './Asset.css'
import { isAssetOwnedByUser } from '../../utils/isAssetOwnedByUser'
import { formatEthPrice } from '../../utils/currency'
import { toSignificant } from '../../utils/toSignificant'
import { useTimeout } from '../../hooks/useTimeout'

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
    <AssetToolTip
      prompt={
        <Box as="span" fontWeight="normal" className={caption} color="darkGray">
          Expires: {days !== 0 ? `${days} days` : ''} {hours !== 0 ? `${hours} hours` : ''} {minutes} minutes {seconds}{' '}
          seconds
        </Box>
      }
      tooltipPrompt={
        <Box height="16" width="full">
          Expires {expires}
        </Box>
      }
    />
  )
}
=======
import { CloseDropDownIcon, CornerDownLeftIcon, ShareIcon } from '../../components/icons'
import { ExpandableText } from '../../components/layout/ExpandableText'
import { header2 } from '../../css/common.css'
import { themeVars } from '../../css/sprinkles.css'
import { useBag } from '../../hooks'
import { fetchSingleAsset } from '../../queries'
import { CollectionInfoForAsset, GenieAsset } from '../../types'
import { shortenAddress } from '../../utils/address'
import { isAudio } from '../../utils/isAudio'
import { isVideo } from '../../utils/isVideo'
import { rarityProviderLogo } from '../../utils/rarity'
import * as styles from './Asset.css'
>>>>>>> main

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
<<<<<<< HEAD
  switch (mediaType) {
    case 'video':
      return (
        <video
          src={asset.animationUrl}
          className={styles.image}
          autoPlay
          controls
          muted
          loop
          style={{ ['--shadow' as string]: `rgba(${dominantColor.join(', ')}, 0.5)` }}
        />
      )
    case 'image':
      return (
        <img
          className={styles.image}
          src={asset.imageUrl}
          alt={asset.name || asset.collectionName}
          style={{ ['--shadow' as string]: `rgba(${dominantColor.join(', ')}, 0.5)` }}
        />
=======
  const style = { ['--shadow' as string]: `rgba(${dominantColor.join(', ')}, 0.5)` }

  switch (mediaType) {
    case 'video':
      return <video src={asset.animationUrl} className={styles.image} autoPlay controls muted loop style={style} />
    case 'image':
      return (
        <img className={styles.image} src={asset.imageUrl} alt={asset.name || asset.collectionName} style={style} />
>>>>>>> main
      )
    case 'audio':
      return <AudioPlayer {...asset} dominantColor={dominantColor} />
  }
}
<<<<<<< HEAD
=======

enum MediaType {
  Audio = 'audio',
  Video = 'video',
  Image = 'image',
}
>>>>>>> main

const Asset = () => {
  const { tokenId = '', contractAddress = '' } = useParams()
  const { data } = useQuery(['assetDetail', contractAddress, tokenId], () =>
    fetchSingleAsset({ contractAddress, tokenId })
  )
  const { pathname, search } = useLocation()
  const navigate = useNavigate()
  const bagExpanded = useBag((state) => state.bagExpanded)
  const [creatorAddress, setCreatorAddress] = useState('')
  const [ownerAddress, setOwnerAddress] = useState('')
<<<<<<< HEAD
  const [isOwned, setIsOwned] = useState(false)
=======
>>>>>>> main
  const [dominantColor] = useState<[number, number, number]>([0, 0, 0])
  const creatorEnsName = useENSName(creatorAddress)
  const ownerEnsName = useENSName(ownerAddress)
  const parsed = qs.parse(search)
  const asset = useMemo(() => (data ? data[0] : ({} as GenieAsset)), [data])
  const collection = useMemo(() => (data ? data[1] : ({} as CollectionInfoForAsset)), [data])
  const { gridWidthOffset } = useSpring({
    gridWidthOffset: bagExpanded ? 324 : 0,
  })
<<<<<<< HEAD
  const [isSelected, setSelected] = useState(false)
  const itemsInBag = useBag((state) => state.itemsInBag)
  const removeAssetFromBag = useBag((state) => state.removeAssetFromBag)
  const addAssetToBag = useBag((state) => state.addAssetToBag)

  useEffect(() => {
    if (asset.creator) setCreatorAddress(asset.creator.address)

    // @ts-ignore
    if (asset.owner) setOwnerAddress(asset.owner)
  }, [asset])

  console.log(asset.sellorders)

  const { rarityProvider, rarityLogo } = useMemo(
=======
  const [showTraits, setShowTraits] = useState(true)

  useEffect(() => {
    if (asset.creator) setCreatorAddress(asset.creator.address)
    if (asset.owner) setOwnerAddress(asset.owner)
  }, [asset])

  const { rarityProvider } = useMemo(
>>>>>>> main
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

<<<<<<< HEAD
  useEffect(() => {
    setSelected(
      !!itemsInBag.find((item) => item.asset.tokenId === asset.tokenId && item.asset.address === asset.address)
    )
  }, [asset, itemsInBag])

  const { account: address } = useWeb3React()

  useEffect(() => {
    // @ts-ignore
    isAssetOwnedByUser({
      tokenId: asset.tokenId,
      userAddress: address || '',
      assetAddress: asset.address,
      tokenType: asset.tokenType,
    }).then(setIsOwned)
  }, [asset, address])

  const assetMediaType = useMemo(() => {
    if (isAudio(asset.animationUrl)) {
      return 'audio'
    } else if (isVideo(asset.animationUrl)) {
      return 'video'
    }
    return 'image'
=======
  const assetMediaType = useMemo(() => {
    if (isAudio(asset.animationUrl)) {
      return MediaType.Audio
    } else if (isVideo(asset.animationUrl)) {
      return MediaType.Video
    }
    return MediaType.Image
>>>>>>> main
  }, [asset])

  return (
    <AnimatedBox
      style={{
        // @ts-ignore
<<<<<<< HEAD
        width: gridWidthOffset.to((x) => `calc(100% - ${x}px)`),
=======
        width: gridWidthOffset.interpolate((x) => `calc(100% - ${x}px)`),
>>>>>>> main
      }}
      className={styles.container}
    >
      <div className={styles.columns}>
<<<<<<< HEAD
        <Column paddingTop="48">
          {assetMediaType === 'image' ? (
=======
        <Column className={styles.column}>
          {assetMediaType === MediaType.Image ? (
>>>>>>> main
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
<<<<<<< HEAD
        <Column className={clsx(styles.column, styles.columnRight)} paddingTop="48" width="full">
          <Column>
            <Row marginBottom="8" alignItems="center" justifyContent={rarityProvider ? 'space-between' : 'flex-end'}>
              {rarityProvider ? (
                <AssetToolTip
                  prompt={
                    <Center
                      paddingLeft="6"
                      paddingRight="4"
                      className={badge}
                      backgroundColor="lightGray"
                      color="blackBlue"
                      borderRadius="4"
                    >
                      #{rarityProvider.rank} <img src="/nft/svgs/rarity.svg" height={15} width={15} alt="Rarity rank" />
                    </Center>
                  }
                  tooltipPrompt={
                    <Row gap="4">
                      <img src={rarityLogo} width={16} alt={rarityProvider.provider} />
                      Ranking by{' '}
                      {asset.rarity?.primaryProvider === 'Genie' ? fallbackProvider : asset.rarity?.primaryProvider}
                    </Row>
                  }
                />
              ) : null}
=======
        <Column className={clsx(styles.column, styles.columnRight)} width="full">
          <Column>
            <Row marginBottom="8" alignItems="center" justifyContent={rarityProvider ? 'space-between' : 'flex-end'}>
>>>>>>> main
              <Row gap="12">
                <Center
                  as="button"
                  padding="0"
                  border="none"
<<<<<<< HEAD
                  cursor="pointer"
=======
>>>>>>> main
                  background="transparent"
                  onClick={async () => {
                    await navigator.clipboard.writeText(window.location.hostname + pathname)
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
<<<<<<< HEAD
                    if (!parsed.origin || parsed.origin === 'collection')
                      navigate(`/nft/collection/${asset.address}`, undefined)
                    else if (parsed.origin === 'sell') navigate('/nft/sell', undefined)
                    else if (parsed.origin === 'explore') navigate(`/nft`, undefined)
                    else if (parsed.origin === 'activity') {
=======
                    if (!parsed.origin || parsed.origin === 'collection') {
                      navigate(`/nft/collection/${asset.address}`, undefined)
                    } else if (parsed.origin === 'sell') {
                      navigate('/nft/sell', undefined)
                    } else if (parsed.origin === 'explore') {
                      navigate(`/nft`, undefined)
                    } else if (parsed.origin === 'activity') {
>>>>>>> main
                      navigate(`/nft/collection/${asset.address}/activity`, undefined)
                    }
                  }}
                >
                  {parsed.origin ? (
                    <CornerDownLeftIcon width="28" height="28" />
                  ) : (
                    <CloseDropDownIcon color={themeVars.colors.darkGray} />
                  )}
                </Center>
              </Row>
            </Row>
            <Row as="h1" marginTop="0" marginBottom="12" gap="2" className={header2}>
<<<<<<< HEAD
              {asset.openseaSusFlag ? (
                <AssetToolTip
                  prompt={<SuspiciousIcon height="30" width="30" viewBox="0 0 16 17" />}
                  tooltipPrompt={<Box fontWeight="normal">Reported for suspicious activity on OpenSea</Box>}
                />
              ) : null}
=======
>>>>>>> main
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
<<<<<<< HEAD
                // mobile: 'flex-start',
              }}
              gap={{
                // mobile: '64',
=======
              }}
              gap={{
>>>>>>> main
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
<<<<<<< HEAD
                    avatarUrl={asset.owner?.profile_img_url}
=======
                    avatarUrl=""
>>>>>>> main
                    name={ownerEnsName.ENSName ?? shortenAddress(ownerAddress, 0, 4)}
                  />
                </a>
              )}

<<<<<<< HEAD
              <a href={`#/nfts/collection/${asset.address}`} style={{ textDecoration: 'none' }}>
=======
              <Link to={`/collection/${asset.address}`} style={{ textDecoration: 'none' }}>
>>>>>>> main
                <CollectionProfile
                  label="Collection"
                  avatarUrl={collection.collectionImageUrl}
                  name={collection.collectionName}
                  isVerified={collection.isVerified}
                />
<<<<<<< HEAD
              </a>
=======
              </Link>
>>>>>>> main

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
<<<<<<< HEAD
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
              style={{ background: 'rgba(76, 130, 251, 0.24)' }}
              gap="8"
            >
              <Column justifyContent="flex-start" gap="8">
                <Row gap="12" as="a" target="_blank" rel="norefferer" href={asset.sellorders[0].marketplaceUrl}>
                  <img
                    className={styles.marketplace}
                    src={`/nft/svgs/marketplaces/${asset.sellorders[0].marketplace}.svg`}
                    height={16}
                    width={16}
                    alt="Markeplace"
                  />
                  <Row as="span" className={subhead} color="blackBlue">
                    {formatEthPrice(asset.priceInfo.ETHPrice)} <Eth2Icon />
                  </Row>
                  <Box as="span" color="darkGray" className={bodySmall}>
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
                cursor="pointer"
                style={{ maxWidth: '244px' }}
                width="full"
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
          <Tabs>
            <Row gap="32" marginBottom="20">
              <Tab>
                <button className={styles.tab}>Traits</button>
              </Tab>
              <Tab>
                <button className={styles.tab}>Details</button>
              </Tab>
            </Row>
            <Panel>
              <Traits collectionAddress={asset.address} traits={asset.traits ? asset.traits : []} />
            </Panel>
            <Panel>
=======

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
>>>>>>> main
              <Details
                contractAddress={contractAddress}
                tokenId={tokenId}
                tokenType={asset.tokenType}
                blockchain="Ethereum"
                metadataUrl={asset.externalLink}
                totalSupply={collection.totalSupply}
              />
<<<<<<< HEAD
            </Panel>
          </Tabs>
=======
            )}
          </Column>
>>>>>>> main
        </Column>
      </div>
    </AnimatedBox>
  )
}

export default Asset
