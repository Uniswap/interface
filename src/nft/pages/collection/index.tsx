import { AnimatedBox, Box } from 'nft/components/Box'
import { CollectionNfts, CollectionStats, Filters } from 'nft/components/collection'
import { Column, Row } from 'nft/components/Flex'
import { useIsMobile } from 'nft/hooks/useIsMobile'
import * as styles from 'nft/pages/collection/index.css'
import { CollectionStatsFetcher } from 'nft/queries'
import { useQuery } from 'react-query'
import { useParams } from 'react-router-dom'

const Collection = () => {
  const { contractAddress } = useParams()

  const isMobile = useIsMobile()

  const { data: collectionStats } = useQuery(['collectionStats', contractAddress], () =>
    CollectionStatsFetcher(contractAddress as string)
  )

  return (
    <Column width="full">
      <Box width="full" height="160">
        <Box
          as="img"
          maxHeight="full"
          width="full"
          src={collectionStats?.bannerImageUrl}
          className={`${styles.bannerImage}`}
        />
      </Box>

      {collectionStats && (
        <Row paddingLeft="32" paddingRight="32">
          <CollectionStats stats={collectionStats} isMobile={isMobile} />
        </Row>
      )}
      <Row alignItems="flex-start" position="relative" paddingX="48">
        <Filters />
        <AnimatedBox width="full">
          {contractAddress && <CollectionNfts contractAddress={contractAddress} />}
        </AnimatedBox>
      </Row>
    </Column>
  )
}

export default Collection
