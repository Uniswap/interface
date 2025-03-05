import { DEFAULT_WALLET_ASSET_QUERY_AMOUNT } from 'nft/components/profile/view/ProfilePage'
import { Flex, Shine } from 'ui/src'

const ProfileAssetCardDisplaySectionSkeleton = () => {
  return (
    <Flex
      width="100%"
      gap="8px"
      $platform-web={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(calc(100%/2 - 8px), 1fr) )',
      }}
      $lg={{
        '$platform-web': {
          gridTemplateColumns: 'repeat(auto-fill, minmax(calc(100%/3 - 8px), 1fr) )',
        },
      }}
      $xl={{
        '$platform-web': {
          gridTemplateColumns: 'repeat(auto-fill, minmax(calc(100%/3 - 12px), 1fr) )',
        },
      }}
      $xxl={{
        gridTemplateColumns: 'repeat(auto-fill, minmax(calc(100%/4 - 16px), 1fr) )',
      }}
      $xxxl={{
        gridTemplateColumns: 'repeat(auto-fill, minmax(calc(100%/5 - 16px), 1fr) )',
      }}
    >
      {Array.from(Array(DEFAULT_WALLET_ASSET_QUERY_AMOUNT), (_, index) => (
        <Shine key={`${index}-shine`}>
          <Flex key={index} width="100%" height={330} borderRadius="$rounded20" backgroundColor="$surface2" />
        </Shine>
      ))}
    </Flex>
  )
}

export const ProfileBodyLoadingSkeleton = () => {
  return (
    <Flex width="100%" gap="18px">
      <Flex row width="100%" mb={30} gap="$gap12">
        <Shine>
          <Flex width={180} height="$spacing36" borderRadius="$rounded12" backgroundColor="$surface2" />
        </Shine>
      </Flex>
      <Flex row width="100%" justifyContent="space-between">
        <Shine>
          <Flex borderRadius="$rounded12" width={92} height={44} backgroundColor="$surface2" />
        </Shine>
        <Shine>
          <Flex borderRadius="$rounded12" width={80} height={44} backgroundColor="$surface2" />
        </Shine>
      </Flex>
      <ProfileAssetCardDisplaySectionSkeleton />
    </Flex>
  )
}
