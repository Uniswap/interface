import { Box } from 'nft/components/Box'
import { Column, Row } from 'nft/components/Flex'
import { BagCloseIcon } from 'nft/components/icons'
import { roundAndPluralize } from 'nft/utils/roundAndPluralize'
import styled from 'styled-components/macro'
import { ButtonText, ThemedText } from 'theme'

import * as styles from './BagHeader.css'

const ClearButton = styled(ButtonText)`
  color: ${({ theme }) => theme.textSecondary};
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  line-height: 16px;
  transition: 150ms ease color;

  :hover {
    color: ${({ theme }) => theme.accentActive};
  }
`
const ControlRow = styled.div`
  align-items: center;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`
interface BagHeaderProps {
  numberOfAssets: number
  toggleBag: () => void
  resetFlow: () => void
  isProfilePage: boolean
}

export const BagHeader = ({ numberOfAssets, toggleBag, resetFlow, isProfilePage }: BagHeaderProps) => {
  return (
    <Column gap="4" paddingX="32" marginBottom="20">
      <Row className={styles.header}>
        <ThemedText.HeadlineSmall>{isProfilePage ? 'Sell NFTs' : 'My bag'}</ThemedText.HeadlineSmall>
        <Box display="flex" padding="2" color="textPrimary" cursor="pointer" onClick={toggleBag}>
          <BagCloseIcon />
        </Box>
      </Row>
      {numberOfAssets > 0 && (
        <ControlRow>
          <ThemedText.BodyPrimary>{roundAndPluralize(numberOfAssets, 'NFT')}</ThemedText.BodyPrimary>
          <ClearButton onClick={resetFlow}>Clear all</ClearButton>
        </ControlRow>
      )}
    </Column>
  )
}
