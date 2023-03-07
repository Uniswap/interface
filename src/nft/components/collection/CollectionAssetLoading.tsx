import { ASSET_PAGE_SIZE } from 'graphql/data/nft/Asset'
import { loadingAsset } from 'nft/css/loading.css'

import SizingImage from '../../../assets/images/sizingImage.png'
import { Box } from '../../components/Box'
import { Row } from '../Flex'
import * as styles from './CollectionAssetLoading.css'

const CollectionAssetLoading = ({ height }: { height?: number }) => {
  return (
    <Box as="div" className={styles.collectionAssetLoading}>
      <Box as="div" position="relative" width="full" style={{ height }}>
        <Box as="div" className={styles.collectionAssetsImageLoading} />
        <Box as="img" width="full" opacity="0" src={SizingImage} draggable={false} />
      </Box>
      <Row justifyContent="space-between" marginTop="12" paddingLeft="12" paddingRight="12">
        <Box as="div" className={loadingAsset} height="12" width="120"></Box>
      </Row>
      <Row justifyContent="space-between" marginTop="12" paddingLeft="12" paddingRight="12">
        <Box as="div" className={loadingAsset} height="16" width="80"></Box>
      </Row>
    </Box>
  )
}

export const LoadingAssets = ({ count, height }: { count?: number; height?: number }) => (
  <>
    {Array.from(Array(count ?? ASSET_PAGE_SIZE), (_, index) => (
      <CollectionAssetLoading key={index} height={height} />
    ))}
  </>
)
