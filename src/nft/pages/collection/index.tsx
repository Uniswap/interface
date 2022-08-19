import { useQuery } from 'react-query'
import { useParams } from 'react-router-dom'

import { useIsMobile } from '../../hooks/useIsMobile'
import { CollectionStatsFetcher } from '../../queries'
import { CollectionDesktop } from './CollectionDesktop'
import { CollectionMobile } from './CollectionMobile'

const Collection = () => {
  const { contractAddress } = useParams()

  const isMobile = useIsMobile()

  const { data: collectionStats } = useQuery(['collectionStats', contractAddress], () =>
    CollectionStatsFetcher(contractAddress as string)
  )

  return isMobile ? (
    <CollectionMobile collectionStats={collectionStats} />
  ) : (
    <CollectionDesktop collectionStats={collectionStats} />
  )
}

export default Collection
