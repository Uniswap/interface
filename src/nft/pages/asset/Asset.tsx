import clsx from 'clsx'
import useENSName from 'hooks/useENSName'
import qs from 'query-string'
import { useEffect, useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { useQuery } from 'react-query'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useSpring } from 'react-spring/web'

import { AnimatedBox, Box } from '../../components/Box'
import { CollectionProfile } from '../../components/details/CollectionProfile'
import { Details } from '../../components/details/Details'
import { Traits } from '../../components/details/Traits'
import { Center, Column, Row } from '../../components/Flex'
import { CloseDropDownIcon, CornerDownLeftIcon, ShareIcon, SuspiciousIcon } from '../../components/icons'
import { ExpandableText } from '../../components/layout/ExpandableText'
import { Panel, Tab, Tabs } from '../../components/layout/Tabs'
import { badge, header2 } from '../../css/common.css'
import { themeVars } from '../../css/sprinkles.css'
import { useBag } from '../../hooks'
import { fetchSingleAsset } from '../../queries'
import { CollectionInfoForAsset, GenieAsset } from '../../types'
import { shortenAddress } from '../../utils/address'
import { isAudio } from '../../utils/isAudio'
import { isVideo } from '../../utils/isVideo'
import { fallbackProvider, rarityProviderLogo } from '../../utils/rarity'
import * as styles from './Asset.css'

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
      )
    case 'audio':
      return <AudioPlayer {...asset} dominantColor={dominantColor} />
  }
}

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
  const [dominantColor] = useState<[number, number, number]>([0, 0, 0])
  const creatorEnsName = useENSName(creatorAddress)
  const ownerEnsName = useENSName(ownerAddress)
  const parsed = qs.parse(search)
  const asset = useMemo(() => (data ? data[0] : ({} as GenieAsset)), [data])
  const collection = useMemo(() => (data ? data[1] : ({} as CollectionInfoForAsset)), [data])
  const { gridWidthOffset } = useSpring({
    gridWidthOffset: bagExpanded ? 324 : 0,
  })

  useEffect(() => {
    if (asset.creator) setCreatorAddress(asset.creator.address)
    if (asset.owner) setOwnerAddress(asset.owner)
  }, [asset])

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
      return 'audio'
    } else if (isVideo(asset.animationUrl)) {
      return 'video'
    }
    return 'image'
  }, [asset])

  return (
    <AnimatedBox
      style={{
        // @ts-ignore
        width: gridWidthOffset.interpolate((x) => `calc(100% - ${x}px)`),
      }}
      className={styles.container}
    >
      <div className={styles.columns}>
        <Column className={styles.column}>
          {assetMediaType === 'image' ? (
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
            <Row marginBottom="8" alignItems="center" justifyContent={rarityProvider ? 'space-between' : 'flex-end'}>
              <Row gap="12">
                <Center
                  as="button"
                  padding="0"
                  border="none"
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
                    if (!parsed.origin || parsed.origin === 'collection')
                      navigate(`/nft/collection/${asset.address}`, undefined)
                    else if (parsed.origin === 'sell') navigate('/nft/sell', undefined)
                    else if (parsed.origin === 'explore') navigate(`/nft`, undefined)
                    else if (parsed.origin === 'activity') {
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

              <a href={`/collection/${asset.address}`} style={{ textDecoration: 'none' }}>
                <CollectionProfile
                  label="Collection"
                  avatarUrl={collection.collectionImageUrl}
                  name={collection.collectionName}
                  isVerified={collection.isVerified}
                />
              </a>

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
                <Details
                  contractAddress={contractAddress}
                  tokenId={tokenId}
                  tokenType={asset.tokenType}
                  blockchain="Ethereum"
                  metadataUrl={asset.externalLink}
                  totalSupply={collection.totalSupply}
                />
              </Panel>
            </Tabs>
          </Column>
        </Column>
      </div>
    </AnimatedBox>
  )
}

export default Asset
