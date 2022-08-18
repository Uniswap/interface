import { useWindowSize } from 'hooks/useWindowSize'
import { useEffect } from 'react'
import { useQuery } from 'react-query'
import { useParams } from 'react-router-dom'

import { useIsMobile } from '../../hooks/useIsMobile'
import { CollectionStatsFetcher } from '../../queries'
import { CollectionDesktop } from './CollectionDesktop'
import { CollectionMobile } from './CollectionMobile'

const Collection = () => {
  const { contractAddress } = useParams()

  const { isMobile, setMobileWidth } = useIsMobile()

  const { data: collectionStats } = useQuery(['collectionStats', contractAddress], () =>
    CollectionStatsFetcher(contractAddress as string)
  )

  const { width } = useWindowSize()
  useEffect(() => {
    setMobileWidth(width ?? 0)
  }, [width, setMobileWidth])

  if (isMobile) return <CollectionMobile {...{ collectionStats }} />

  return <CollectionDesktop {...{ collectionStats }} />
}

export default Collection
