import { useWindowSize } from 'hooks/useWindowSize'
import { GenieCollection } from 'nft/types'
import { useEffect, useMemo } from 'react'
import { useQuery } from 'react-query'
import { useLocation, useParams } from 'react-router-dom'

import { useIsMobile } from '../../hooks/useIsMobile'
import { CollectionStatsFetcher } from '../../queries'
import { CollectionDesktop } from './CollectionDesktop'
import { CollectionMobile } from './CollectionMobile'

const Collection = () => {
  const { contractAddress } = useParams()

  const isMobile = useIsMobile((state) => state.isMobile)
  const setMobileWidth = useIsMobile((state) => state.setMobileWidth)
  const location = useLocation()
  const isActivityToggled = useMemo(() => location.pathname.includes('/activity'), [location])

  const { data: collectionStats } = useQuery(['collectionStats', contractAddress], () =>
    CollectionStatsFetcher(contractAddress as string)
  )

  const { width } = useWindowSize()
  useEffect(() => {
    setMobileWidth(width ?? 0)
  }, [width, setMobileWidth])

  if (isMobile)
    return <CollectionMobile {...{ collectionStats: collectionStats ?? ({} as GenieCollection), isActivityToggled }} />

  return <CollectionDesktop {...{ collectionStats: collectionStats ?? ({} as GenieCollection), isActivityToggled }} />
}

export default Collection
