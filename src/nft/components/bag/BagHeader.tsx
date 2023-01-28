import { Trans } from '@lingui/macro'
import { OpacityHoverState } from 'components/Common'
import { Column } from 'nft/components/Flex'
import { BagCloseIcon } from 'nft/components/icons'
import { BagView } from 'nft/types'
import { useMemo } from 'react'
import styled from 'styled-components/macro'
import { ButtonText, ThemedText } from 'theme'

const BagSelector = styled.div`
  display: flex;
  flex-direction: row;
`
const BagButton = styled.button`
  margin-right: 10px;
  padding: 0px;
  background-color: transparent;
  border: none;
  cursor: pointer;

  ${OpacityHoverState}
`
const BagControls = styled.div`
  width: 90px;
  justify-content: space-between;
  display: flex;
  flex-direction: row;
  margin-top: 4px;
`
const ClearButton = styled(ButtonText)`
  color: ${({ theme }) => theme.textSecondary};
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  line-height: 16px;
  margin: 2px;
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
  margin: 0px 0px auto auto;
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
  margin: 16px 28px;
  text-align: left;
`
interface BagHeaderProps {
  bagViews: BagView[]
  activeBagView: BagView
  changeBagView: (newView: BagView) => void
  numberOfAssets: number
  closeBag: () => void
  resetFlow: (bagView: BagView) => void
}

const BASE_SIZING = 14
const INCREMENTAL_SIZING = 6

const getCircleSizing = (numberOfAssets: number): string => {
  const numberOfCharacters = numberOfAssets.toString().length

  // each digit adds 6px worth of width (approximately), so I set the height and width to be 6px larger for each digit added
  // 1 digit => 14 + 6, 2 digit 14 + 12, etc.
  return `${BASE_SIZING + INCREMENTAL_SIZING * numberOfCharacters}px`
}

export const BagHeader = ({
  bagViews,
  activeBagView,
  changeBagView,
  numberOfAssets,
  closeBag,
  resetFlow,
}: BagHeaderProps) => {
  const sizing = useMemo(() => getCircleSizing(numberOfAssets), [numberOfAssets])

  return (
    <Wrapper>
      <Column>
        <BagSelector>
          {bagViews.map((view) => (
            <BagButton
              key={view}
              onClick={() => changeBagView(view)}
              style={view === activeBagView ? { pointerEvents: 'none' } : {}}
            >
              <ThemedText.HeadlineSmall opacity={view === activeBagView ? 1 : 0.5}>
                <Trans>{view}</Trans>
              </ThemedText.HeadlineSmall>
            </BagButton>
          ))}
        </BagSelector>
        {numberOfAssets > 0 && (
          <BagControls>
            <CounterDot sizing={sizing}>{numberOfAssets}</CounterDot>
            <ClearButton onClick={() => resetFlow(activeBagView)}>
              <Trans>Clear all</Trans>
            </ClearButton>
          </BagControls>
        )}
      </Column>
      <IconWrapper onClick={closeBag}>
        <BagCloseIcon data-testid="nft-bag-close-icon" />
      </IconWrapper>
    </Wrapper>
  )
}
