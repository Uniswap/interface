import { loadingAsset } from 'nft/css/loading.css'

import SizingImage from '../../../assets/images/sizingImage.png'
import { Box } from '../../components/Box'
import { Row } from '../Flex'
import * as styles from './CollectionAssetLoading.css'

export const CollectionAssetLoading = () => {
  return (
    <Box as="div" className={styles.collectionAssetLoading}>
      <Box as="div" position="relative" width="full">
        <Box as="div" className={styles.collectionAssetsImageLoading} />
        <Box as="img" width="full" opacity="0" src={SizingImage} draggable={false} />
      </Box>
      <Row justifyContent="space-between" marginTop="12" paddingLeft="12" paddingRight="12">
        <Box as="div" className={loadingAsset} height="12" width="120"></Box>
        <Box as="div" className={loadingAsset} width="36" height="12"></Box>
      </Row>
      <Row justifyContent="space-between" marginTop="12" paddingLeft="12" paddingRight="12">
        <Box as="div" className={loadingAsset} height="16" width="80"></Box>
        <Box as="div" className={loadingAsset} width="16" height="16" borderRadius="4"></Box>
      </Row>
      <Row marginTop="12" paddingLeft="12" paddingRight="12">
        <Box as="div" className={loadingAsset} width="full" height="32"></Box>
      </Row>
    </Box>
  )
}
