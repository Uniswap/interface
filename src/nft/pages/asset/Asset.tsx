import { useMemo, useEffect, useState } from 'react'
import { useQuery } from 'react-query'
import { useSpring } from '@react-spring/web'
import clsx from 'clsx'
import { useNavigate, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import qs from 'query-string'
import { useTimeout } from '../../../hooks/usetimeout'
import AssetToolTip from '../../components/badge/AssetToolTip'
import { AnimatedBox, Box } from '../../components/Box'
import { Details } from '../../components/details/Details'
import { CollectionProfile } from '../../components/details/CollectionProfile'
import { fetchSingleAsset } from '../../queries'
import { CollectionInfoForAsset, GenieAsset, SellOrder } from '../../types'
import * as styles from './Asset.css'
import { useBag } from '../../hooks'
import { Center, Column, Row } from '../../components/Flex'
import { isAudio } from '../../utils/isAudio'
import { isVideo } from '../../utils/isVideo'
import { fallbackProvider, rarityProviderLogo } from '../../utils/rarity'
import { caption, header2, badge } from '../../css/common.css'
import { shortenAddress } from '../../utils/address'
import { CloseDropDownIcon, CornerDownLeftIcon, ShareIcon, SuspiciousIcon } from '../../components/icons'
import { themeVars } from '../../css/sprinkles.css'
import { ExpandableText } from '../../components/layout/ExpandableText'
import useENSName from 'hooks/useENSName'
import { Panel, Tab, Tabs } from '../../components/layout/Tabs'
import { Traits } from '../../components/details/Traits'

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

  const bagExpanded = useBag((state) => state.bagExpanded)

  const { gridWidthOffset } = useSpring({
    gridWidthOffset: bagExpanded ? 324 : 0,
  })

  let asset = {} as GenieAsset
  let collection = {} as CollectionInfoForAsset

  if (data) {
    asset = data[0] || {}
    collection = data[1] || {}
  }
  const navigate = useNavigate()
  const parsed = qs.parse(location.search)
  const [creatorAddress, setCreatorAddress] = useState('')
  const [ownerAddress, setOwnerAddress] = useState('')
  const [dominantColor] = useState<[number, number, number]>([0, 0, 0])
  const ownerEnsName = useENSName(ownerAddress)
  const creatorEnsName = useENSName(creatorAddress)
  const { rarityProvider, rarityLogo } = useMemo(() => {
    if (asset.rarity) {
      return {
        rarityProvider: asset.rarity?.providers.find(
          ({ provider: _provider }) => _provider === asset.rarity?.primaryProvider
        ),
        rarityLogo: rarityProviderLogo[asset.rarity.primaryProvider] || '',
      }
    } else return {}
  }, [asset.rarity])

  useEffect(() => {
    if (asset.owner) setOwnerAddress(asset.owner.address)
    if (asset.creator) setCreatorAddress(asset.creator.address)
  }, [asset])

  const assetMediaType = useMemo(() => {
    if (isAudio(asset.animationUrl)) {
      return 'audio'
    } else if (isVideo(asset.animationUrl)) {
      return 'video'
    } else return 'image'
  }, [asset])

  return (
    <div>
      <AnimatedBox
        style={{
          // @ts-ignore
          width: gridWidthOffset.to((x) => `calc(100% - ${x}px)`),
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
                        #{rarityProvider.rank}{' '}
                        <img src="/nft/svgs/rarity.svg" height={15} width={15} alt="Rarity rank" />
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
                <Row gap="12">
                  <Center
                    as="button"
                    padding="0"
                    border="none"
                    background="transparent"
                    onClick={async () => {
                      await navigator.clipboard.writeText(window.location.hostname + location.pathname)
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
                {asset.openseaSusFlag ? (
                  <AssetToolTip
                    prompt={<SuspiciousIcon height="30" width="30" viewBox="0 0 16 17" />}
                    tooltipPrompt={<Box fontWeight="normal">Reported for suspicious activity on OpenSea</Box>}
                  />
                ) : null}
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
                  // mobile: 'flex-start',
                }}
                gap={{
                  // mobile: '64',
                  sm: 'unset',
                }}
                marginBottom="36"
              >
                <a
                  target="_blank"
                  rel="noreferrer"
                  href={`https://etherscan.io/address/${asset.owner?.address}`}
                  style={{ textDecoration: 'none' }}
                >
                  {/* <CollectionProfile
                    label="Owner"
                    avatarUrl={asset.owner?.profile_img_url}
                    name={ownerEnsName.ENSName ?? shortenAddress(ownerAddress, 0, 4)}
                  /> */}
                </a>

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
        </div>{' '}
      </AnimatedBox>
    </div>
  )
}

export default Asset
