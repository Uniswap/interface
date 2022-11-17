import { Trans } from '@lingui/macro'
import { OpacityHoverState } from 'components/Common'
import { BagCloseIcon } from 'nft/components/icons'
import { useMemo } from 'react'
import styled from 'styled-components/macro'
import { ButtonText, ThemedText } from 'theme'

const ClearButton = styled(ButtonText)`
  color: ${({ theme }) => theme.textSecondary};
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  line-height: 16px;

  :active {
    text-decoration: none;
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
  flex-direction: row;
  justify-content: flex-end;
  margin-left: auto;
  padding: 2px;
  opacity: 1;

  ${OpacityHoverState}
`
const CounterDot = styled.div<{ sizing: string }>`
  align-items: center;
  background-color: ${({ theme }) => theme.accentAction};
  border-radius: 100px;
  font-weight: bold;
  color: ${({ theme }) => theme.accentTextLightPrimary};
  display: flex;
  font-size: 10px;
  justify-content: center;
  min-width: ${({ sizing }) => sizing};
  min-height: ${({ sizing }) => sizing};
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

const BASE_SIZING = 14
const INCREMENTAL_SIZING = 6

const getCircleSizing = (numberOfAssets: number): string => {
  const numberOfCharacters = numberOfAssets.toString().length

  // each digit adds 6px worth of width (approximately), so I set the height and width to be 6px larger for each digit added
  // 1 digit => 14 + 6, 2 digit 14 + 12, etc.
  return `${BASE_SIZING + INCREMENTAL_SIZING * numberOfCharacters}px`
}

export const BagHeader = ({ numberOfAssets, closeBag, resetFlow, isProfilePage }: BagHeaderProps) => {
  const sizing = useMemo(() => getCircleSizing(numberOfAssets), [numberOfAssets])

  return (
    <Wrapper>
      <ThemedText.HeadlineSmall>{isProfilePage ? <Trans>Sell</Trans> : <Trans>Bag</Trans>}</ThemedText.HeadlineSmall>
      {numberOfAssets > 0 && (
        <>
          <CounterDot sizing={sizing}>{numberOfAssets}</CounterDot>
          <ClearButton onClick={resetFlow}>Clear all</ClearButton>
        </>
      )}
      <IconWrapper onClick={closeBag}>
        <BagCloseIcon />
      </IconWrapper>
    </Wrapper>
  )
}
