import { useIsNftProfilePage } from 'hooks/useIsNftPage'
import { Center, Column } from 'nft/components/Flex'
import { BagIcon, LargeTagIcon } from 'nft/components/icons'
import { subhead } from 'nft/css/common.css'
import { themeVars } from 'nft/css/sprinkles.css'
import styled from 'styled-components/macro'

const StyledColumn = styled(Column)`
  gap: 12px;
  margin-top: 68px;
`

const EmptyState = () => {
  const isProfilePage = useIsNftProfilePage()

  return (
    <StyledColumn>
      <Center>
        {isProfilePage ? (
          <LargeTagIcon color={themeVars.colors.textTertiary} />
        ) : (
          <BagIcon color={themeVars.colors.textTertiary} height="96px" width="96px" strokeWidth="1px" />
        )}
      </Center>
      {isProfilePage ? (
        <Center className={subhead}>No NFTs selected</Center>
      ) : (
        <Column gap="16">
          <Center data-testid="nft-empty-bag" className={subhead} style={{ lineHeight: '24px' }}>
            Your bag is empty
          </Center>
          <Center fontSize="12" fontWeight="normal" color="textSecondary" style={{ lineHeight: '16px' }}>
            Selected NFTs will appear here
          </Center>
        </Column>
      )}
    </StyledColumn>
  )
}

export default EmptyState
