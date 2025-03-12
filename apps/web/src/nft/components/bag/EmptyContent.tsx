import { PageType, useIsPage } from 'hooks/useIsPage'
import { BagIcon, LargeTagIcon } from 'nft/components/icons'
import { themeVars } from 'nft/css/sprinkles.css'
import { Flex, Text } from 'ui/src'

const EmptyState = () => {
  const isProfilePage = useIsPage(PageType.NFTS_PROFILE)

  return (
    <Flex gap="$gap12" mt={68}>
      <Flex justifyContent="center" alignItems="center">
        {isProfilePage ? (
          <LargeTagIcon color={themeVars.colors.neutral3} />
        ) : (
          <BagIcon color={themeVars.colors.neutral3} height="96px" width="96px" strokeWidth="1px" />
        )}
      </Flex>
      {isProfilePage ? (
        <Text textAlign="center" variant="subheading1" data-testid="nft-no-nfts-selected">
          No NFTs selected
        </Text>
      ) : (
        <Flex gap="$gap16">
          <Text textAlign="center" data-testid="nft-empty-bag" variant="subheading1">
            Your bag is empty
          </Text>
          <Text textAlign="center" variant="body3" color="$neutral2">
            Selected NFTs will appear here
          </Text>
        </Flex>
      )}
    </Flex>
  )
}

export default EmptyState
