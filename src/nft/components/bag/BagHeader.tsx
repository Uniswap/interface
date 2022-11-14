import { Trans } from '@lingui/macro'
import { OpacityHoverState } from 'components/Common'
import { BagCloseIcon } from 'nft/components/icons'
import styled from 'styled-components/macro'
import { ButtonText, ThemedText } from 'theme'

const ClearButton = styled(ButtonText)`
  color: ${({ theme }) => theme.textSecondary};
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  line-height: 16px;
`

const IconWrapper = styled.button`
  align-items: center;
  background-color: transparent;
  border-radius: 8px;
  border: none;
  color: ${({ theme }) => theme.textPrimary};
  cursor: pointer;
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  margin-left: auto;
  padding: 2px;
  opacity: 1;

  ${OpacityHoverState}
`
const CounterDot = styled.div`
  align-items: center;
  background-color: ${({ theme }) => theme.accentAction};
  border-radius: 100px;
  color: ${({ theme }) => theme.accentTextLightPrimary};
  display: flex;
  font-size: 10px;
  justify-content: center;
  padding: 4px 6px;
`
const Wrapper = styled.div`
  align-items: center;
  display: flex;
  flex-direction: row;
  gap: 8px;
  justify-content: flex-start;
  margin: 16px 20px;
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
          <CounterDot>{numberOfAssets}</CounterDot>
          <ClearButton onClick={resetFlow}>Clear all</ClearButton>
        </>
      )}
      <IconWrapper onClick={closeBag}>
        <BagCloseIcon />
      </IconWrapper>
    </Wrapper>
  )
}
