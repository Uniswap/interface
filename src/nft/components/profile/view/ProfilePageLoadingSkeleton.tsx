import { Box } from 'nft/components/Box'
import { assetList } from 'nft/components/collection/CollectionNfts.css'
import { loadingAsset } from 'nft/css/loading.css'
import { ScreenBreakpointsPaddings } from 'nft/pages/collection/index.css'
import styled from 'styled-components/macro'

import { DEFAULT_WALLET_ASSET_QUERY_AMOUNT } from './ProfilePage'

const SkeletonPageWrapper = styled.div`
  ${ScreenBreakpointsPaddings};
  padding-top: 40px;
  width: 100%;

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    padding-top: 16px;
  }
`

const SkeletonBodyWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 18px;
`

const SkeletonRowWrapper = styled.div`
  display: flex;
  flex-direct: row;
  width: 100%;
`

const AccountDetailsSkeletonWrapper = styled(SkeletonRowWrapper)`
  gap: 12px;
  margin-bottom: 30px;
`

const ProfileDetailsSkeleton = styled.div`
  width: 180px;
  height: 36px;
  border-radius: 12px;
`

const FilterBarSkeletonWrapper = styled(SkeletonRowWrapper)`
  justify-content: space-between;
`

const FilterButtonSkeleton = styled.div`
  width: 92px;
  height: 44px;
  border-radius: 12px;
`

const SellButtonSkeleton = styled.div`
  width: 80px;
  height: 44px;
  border-radius: 12px;
`

const ProfileAssetCardSkeleton = styled.div`
  width: 100%;
  height: 330px;
  border-radius: 20px;
`

const ProfileAssetCardDisplaySectionSkeleton = () => {
  return (
    <Box width="full" className={assetList}>
      {Array.from(Array(DEFAULT_WALLET_ASSET_QUERY_AMOUNT), (_, index) => (
        <ProfileAssetCardSkeleton key={index} className={loadingAsset} />
      ))}
    </Box>
  )
}

export const ProfileBodyLoadingSkeleton = () => {
  return (
    <SkeletonBodyWrapper>
      <AccountDetailsSkeletonWrapper>
        <ProfileDetailsSkeleton className={loadingAsset} />
      </AccountDetailsSkeletonWrapper>
      <FilterBarSkeletonWrapper>
        <FilterButtonSkeleton className={loadingAsset} />
        <SellButtonSkeleton className={loadingAsset} />
      </FilterBarSkeletonWrapper>
      <ProfileAssetCardDisplaySectionSkeleton />
    </SkeletonBodyWrapper>
  )
}

export const ProfilePageLoadingSkeleton = () => {
  return (
    <SkeletonPageWrapper>
      <ProfileBodyLoadingSkeleton />
    </SkeletonPageWrapper>
  )
}
