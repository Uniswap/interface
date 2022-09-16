import { AnimatedBox, Box } from 'nft/components/Box'
import { CollectionNfts, CollectionStats, FilterButton, Filters } from 'nft/components/collection'
import { Column, Row } from 'nft/components/Flex'
import { useFiltersExpanded, useIsMobile } from 'nft/hooks'
import * as styles from 'nft/pages/collection/index.css'
import { CollectionStatsFetcher } from 'nft/queries'
import { useQuery } from 'react-query'
import { useParams } from 'react-router-dom'
import { useSpring } from 'react-spring/web'

const FILTER_WIDTH = 332

const Collection = () => {
  const { contractAddress } = useParams()

  const isMobile = useIsMobile()
  const [isFiltersExpanded, setFiltersExpanded] = useFiltersExpanded()

  const { data: collectionStats } = useQuery(['collectionStats', contractAddress], () =>
    CollectionStatsFetcher(contractAddress as string)
  )

  const { gridX, gridWidthOffset } = useSpring({
    gridX: isFiltersExpanded ? FILTER_WIDTH : 0,
    gridWidthOffset: isFiltersExpanded ? FILTER_WIDTH : 0,
  })

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
        <Box position="sticky" top="72" width="0">
          {isFiltersExpanded && <Filters />}
        </Box>

        {/* @ts-ignore: https://github.com/microsoft/TypeScript/issues/34933 */}
        <AnimatedBox
          style={{
            transform: gridX.interpolate((x) => `translate(${x as number}px)`),
            width: gridWidthOffset.interpolate((x) => `calc(100% - ${x as number}px)`),
          }}
        >
          <AnimatedBox position="sticky" top="72" width="full" zIndex="3">
            <Box backgroundColor="white08" width="full" paddingBottom="8" style={{ backdropFilter: 'blur(24px)' }}>
              <Row marginTop="12" gap="12">
                <FilterButton
                  isMobile={isMobile}
                  isFiltersExpanded={isFiltersExpanded}
                  onClick={() => setFiltersExpanded(!isFiltersExpanded)}
                />
              </Row>
            </Box>
          </AnimatedBox>

          {contractAddress && <CollectionNfts contractAddress={contractAddress} />}
        </AnimatedBox>
      </Row>
    </Column>
  )
}

export default Collection
