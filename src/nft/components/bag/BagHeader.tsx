import { Trans } from '@lingui/macro'
import { BagCloseIcon } from 'nft/components/icons'
import styled from 'styled-components/macro'
import { ButtonText, ThemedText } from 'theme'

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

const IconWrapper = styled.button`
  align-items: center;
  background-color: transparent;
  border-radius: 8px;
  border: none;
  color: ${({ theme }) => theme.textPrimary};
  cursor: pointer;
  display: flex;
  flex: 1 1 auto;
  flex-direction: row;
  justify-content: flex-end;
  padding: 2px;
  opacity: 1;
  &:hover {
    opacity: ${({ theme }) => theme.opacity.hover};
  }

  &:active {
    opacity: ${({ theme }) => theme.opacity.click};
  }

  transition: ${({
    theme: {
      transition: { duration, timing },
    },
  }) => `opacity ${duration.medium} ${timing.ease}`};
`
const NumberDot = styled.div`
  align-items: center;
  background-color: ${({ theme }) => theme.accentActive};
  border-radius: 50%;
  display: flex;
  font-size: 10px;
  height: 20px;
  justify-content: center;
  padding: 4px 8px;
  width: 20px;
`
const Wrapper = styled.div`
  align-items: center;
  display: flex;
  flex-direction: row;
  gap: 8px;
  justify-content: flex-start;
  margin: 0 20px;
  text-align: center;
`
interface BagHeaderProps {
  numberOfAssets: number
  closeBag: () => void
  resetFlow: () => void
  isProfilePage: boolean
}

export const BagHeader = ({ numberOfAssets, closeBag, resetFlow, isProfilePage }: BagHeaderProps) => {
  return (
    <Wrapper>
      <ThemedText.HeadlineSmall>{isProfilePage ? <Trans>Sell</Trans> : <Trans>Bag</Trans>}</ThemedText.HeadlineSmall>
      {numberOfAssets > 0 && (
        <>
          <NumberDot>{numberOfAssets}</NumberDot>
          <ClearButton onClick={resetFlow}>Clear all</ClearButton>
        </>
      )}
      <IconWrapper onClick={closeBag}>
        <BagCloseIcon />
      </IconWrapper>
    </Wrapper>
  )
}
