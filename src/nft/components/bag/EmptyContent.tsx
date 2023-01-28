import { Center, Column } from 'nft/components/Flex'
import { BagIcon, LargeTagIcon } from 'nft/components/icons'
import { subhead } from 'nft/css/common.css'
import { themeVars } from 'nft/css/sprinkles.css'
import { useBag } from 'nft/hooks'
import { BagView } from 'nft/types'
import styled from 'styled-components/macro'

const StyledColumn = styled(Column)`
  gap: 12px;
  margin-top: 68px;
`

const EmptyState = () => {
  const activeBagView = useBag((state) => state.activeBagView)

  return (
    <StyledColumn>
      <Center>
        {activeBagView === BagView.SELL ? (
          <LargeTagIcon color={themeVars.colors.textTertiary} />
        ) : (
          <BagIcon color={themeVars.colors.textTertiary} height="96px" width="96px" strokeWidth="1px" />
        )}
      </Center>
      {activeBagView === BagView.SELL ? (
        <Center data-testid="nft-no-nfts-selected" className={subhead}>
          No NFTs selected
        </Center>
      ) : (
        <Column gap="16">
          <Center data-testid="nft-empty-bag" className={subhead} style={{ lineHeight: '24px' }}>
            {activeBagView === BagView.MAIN ? 'Your bag is empty' : 'No NFTs saved for later'}
          </Center>
          <Center fontSize="12" fontWeight="normal" color="textSecondary" style={{ lineHeight: '16px' }}>
            {activeBagView === BagView.MAIN ? 'Selected NFTs will appear here' : ''}
          </Center>
        </Column>
      )}
    </StyledColumn>
  )
}

export default EmptyState
