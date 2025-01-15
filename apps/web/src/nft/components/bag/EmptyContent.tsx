import { PageType, useIsPage } from 'hooks/useIsPage'
import styled from 'lib/styled-components'
import { Center, Column } from 'nft/components/Flex'
import { BagIcon, LargeTagIcon } from 'nft/components/icons'
import { subhead } from 'nft/css/common.css'
import { themeVars } from 'nft/css/sprinkles.css'

const StyledColumn = styled(Column)`
  gap: 12px;
  margin-top: 68px;
`

const EmptyState = () => {
  const isProfilePage = useIsPage(PageType.NFTS_PROFILE)

  return (
    <StyledColumn>
      <Center>
        {isProfilePage ? (
          <LargeTagIcon color={themeVars.colors.neutral3} />
        ) : (
          <BagIcon color={themeVars.colors.neutral3} height="96px" width="96px" strokeWidth="1px" />
        )}
      </Center>
      {isProfilePage ? (
        <Center data-testid="nft-no-nfts-selected" className={subhead}>
          No NFTs selected
        </Center>
      ) : (
        <Column gap="16">
          <Center data-testid="nft-empty-bag" className={subhead} style={{ lineHeight: '24px' }}>
            Your bag is empty
          </Center>
          <Center fontSize="12" fontWeight="book" color="neutral2" style={{ lineHeight: '16px' }}>
            Selected NFTs will appear here
          </Center>
        </Column>
      )}
    </StyledColumn>
  )
}

export default EmptyState
