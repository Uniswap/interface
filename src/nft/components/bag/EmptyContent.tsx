import { Center, Column } from 'nft/components/Flex'
import { LargeBagIcon, LargeTagIcon } from 'nft/components/icons'
import { subhead } from 'nft/css/common.css'
import { themeVars } from 'nft/css/sprinkles.css'
import { useLocation } from 'react-router-dom'

const EmptyState = () => {
  const { pathname } = useLocation()
  const isProfilePage = pathname.startsWith('/profile')

  return (
    <Column gap={isProfilePage ? '16' : '12'} marginTop="36">
      <Center>
        {isProfilePage ? (
          <LargeTagIcon color={themeVars.colors.textTertiary} />
        ) : (
          <LargeBagIcon color={themeVars.colors.textTertiary} />
        )}
      </Center>
      {isProfilePage ? (
        <span className={subhead}>No NFTs Selected</span>
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
    </Column>
  )
}

export default EmptyState
