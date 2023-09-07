import { loadingAsset } from 'nft/css/loading.css'
import styled from 'styled-components'

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
    </SkeletonBodyWrapper>
  )
}

export const ProfilePageLoadingSkeleton = () => {
  return <ProfileBodyLoadingSkeleton />
}
