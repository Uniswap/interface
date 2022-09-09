import { useMemo } from 'react'
import { useQuery } from 'react-query'
import { useParams } from 'react-router-dom'

import { useTimeout } from '../../../hooks/usetimeout'
import AssetToolTip from '../../components/badge/AssetToolTip'
import { Box } from '../../components/Box'
import { Details } from '../../components/details/Details'
import { caption } from '../../css/common.css'
import { fetchSingleAsset } from '../../queries'
import { CollectionInfoForAsset, GenieAsset, SellOrder } from '../../types'
import * as styles from './Asset.css'

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

  let asset = {} as GenieAsset
  let collection = {} as CollectionInfoForAsset

  if (data) {
    asset = data[0] || {}
    collection = data[1] || {}
  }

  return (
    <div>
      {' '}
      <Details
        contractAddress={contractAddress}
        tokenId={tokenId}
        tokenType={asset.tokenType}
        blockchain="Ethereum"
        metadataUrl={asset.externalLink}
        totalSupply={collection.totalSupply}
      />
    </div>
  )
}

export default Asset
