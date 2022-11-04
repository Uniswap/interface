import { Center, Column } from 'nft/components/Flex'
import { LargeBagIcon, LargeTagIcon } from 'nft/components/icons'
import { subhead } from 'nft/css/common.css'
import { themeVars } from 'nft/css/sprinkles.css'
import { useLocation } from 'react-router-dom'
import styled from 'styled-components/macro'

const StyledColumn = styled(Column)<{ isProfilePage?: boolean }>`
  gap: ${({ isProfilePage }) => !isProfilePage && '12'};
  margin-top: 36;
  display: ${({ isProfilePage }) => isProfilePage && 'flex'};
  justify-content: ${({ isProfilePage }) => isProfilePage && 'center'};
  height: ${({ isProfilePage }) => isProfilePage && 'inherit'};
`

const EmptyState = () => {
  const { pathname } = useLocation()
  const isProfilePage = pathname.startsWith('/profile')

  return (
    <StyledColumn isProfilePage={isProfilePage}>
      <Center>
        {isProfilePage ? (
          <LargeTagIcon color={themeVars.colors.textTertiary} />
        ) : (
          <LargeBagIcon color={themeVars.colors.textTertiary} />
        )}
      </Center>
      {isProfilePage ? (
        <Center className={subhead}>No NFTs selected</Center>
      ) : (
        <Column gap="16">
          <Center className={subhead} style={{ lineHeight: '24px' }}>
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
