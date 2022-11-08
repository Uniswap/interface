import { assetList } from 'nft/components/collection/CollectionNfts.css'
import styled from 'styled-components/macro'

import { DEFAULT_WALLET_ASSET_QUERY_AMOUNT } from './ProfilePage'

const SkeletonPageWrapper = styled.div`
  padding: 40px 72px 52px;
  width: 100%;
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

const ProfilePictureSkeleton = styled.div`
  height: 44px;
  width: 44px;
  background: ${({ theme }) => theme.backgroundModule};
  border-radius: 100px;
`

const ProfileDetailsSkeleton = styled.div`
  width: 180px;
  height: 36px;
  background: ${({ theme }) => theme.backgroundModule};
  border-radius: 12px;
`

const FilterBarSkeletonWrapper = styled(SkeletonRowWrapper)`
  justify-content: space-between;
`

const FilterButtonSkeleton = styled.div`
  width: 92px;
  height: 44px;
  background: ${({ theme }) => theme.backgroundModule};
  border-radius: 12px;
`

const SellButtonSkeleton = styled.div`
  width: 80px;
  height: 44px;
  background: ${({ theme }) => theme.backgroundModule};
  border-radius: 12px;
`

export const ProfileAssetsWrapperSkeleton = styled(SkeletonRowWrapper)`
  flex-wrap: wrap;
  gap: 26px;
  margin-bottom: 20px;
`

export const ProfileAssetCardSkeleton = styled.div`
  width: 100%;
  height: 330px;
  background: ${({ theme }) => theme.backgroundModule};
  border-radius: 20px;
`

export const ProfileBodyLoadingSkeleton = () => {
  return (
    <SkeletonBodyWrapper>
      <AccountDetailsSkeletonWrapper>
        <ProfilePictureSkeleton />
        <ProfileDetailsSkeleton />
      </AccountDetailsSkeletonWrapper>
      <FilterBarSkeletonWrapper>
        <FilterButtonSkeleton />
        <SellButtonSkeleton />
      </FilterBarSkeletonWrapper>
      <div className={assetList}>
        {Array.from(Array(DEFAULT_WALLET_ASSET_QUERY_AMOUNT), (_, index) => (
          <ProfileAssetCardSkeleton key={index} />
        ))}
      </div>
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
