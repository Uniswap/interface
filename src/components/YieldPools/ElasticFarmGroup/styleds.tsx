import { darken, rgba } from 'polished'
import styled, { css } from 'styled-components'

import bgimg from 'assets/images/card-background.png'
import { ButtonLight } from 'components/Button'

export const RewardAndDepositInfo = styled.div`
  display: flex;
  margin: 0 1.5rem;
  gap: 24px;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    flex-direction: column;
  `};

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
      margin: 0 1rem;
  `}
`
export const RewardContainer = styled.div`
  border-radius: 20px;
  width: calc(100% / 3 - 16px);
  padding: 1.25rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: ${({ theme }) => theme.radialGradient};

  ${({ theme }) => theme.mediaWidth.upToLarge`
    width: 100%;
    flex: 1
  `};

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
      flex-direction: column;
      gap: 16px;
  `}
`

export const DepositedContainer = styled.div`
  flex: 1;
  border-radius: 1.25rem;
  padding: 1.25rem 1rem;
  background: ${({ theme }) => theme.buttonBlack};
  display: flex;
  align-items: center;
  justify-content: space-between;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    flex-direction: column;
    gap: 16px;
  `};
`

export const RewardDetailContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    width: 100%;
  `};
`

export const RewardDetail = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      width: 100%;
  `};
`

export const FarmList = styled.div<{ gridMode: boolean }>`
  margin: 1.5rem;
  border-radius: 20px;
  overflow: hidden;
  background: ${({ theme }) => theme.buttonBlack};

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    margin: 1.5rem 1rem;
  `}

  ${({ gridMode }) =>
    gridMode &&
    css`
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 24px;
      background: ${({ theme }) => theme.background};

      ${({ theme }) => theme.mediaWidth.upToLarge`
        grid-template-columns: 1fr 1fr;
      `};

      ${({ theme }) => theme.mediaWidth.upToSmall`
        grid-template-columns: 1fr;
      `};
    `}
`

export const FeeTag = styled.div`
  border-radius: 999px;
  background: ${({ theme }) => theme.darkBlue + '33'};
  color: ${({ theme }) => theme.darkBlue};
  font-size: 10px;
  font-weight: 500;
  padding: 3px 4px;
  margin-left: 6px;
  min-width: 36px;
  display: flex;
  align-items: center;
  gap: 4px;
  height: max-content;
`

export const NFTWrapper = styled.div`
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 12px;
  padding: 12px;
  background: ${({ theme }) => rgba(theme.background, 0.5)};
  width: 100%;
  font-size: 14px;
  line-height: 20px;
`

export const RowWrapper = styled.div<{ isOpen: boolean }>`
  background-color: ${({ theme, isOpen }) => (isOpen ? theme.buttonGray : theme.buttonBlack)};
  :not(:last-child) {
    border-bottom: 1px solid ${({ theme }) => theme.border + '80'};
  }
`

export const NFTListWrapper = styled.div`
  display: grid;
  flex: 1;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: 12px;
  padding: 0 12px 12px;
`

export const FlipCard = styled.div<{ flip: boolean; joined?: boolean }>`
  border-radius: 20px;
  padding: 16px;
  width: 100%;
  min-height: 380px;
  background-color: ${({ theme }) => theme.buttonBlack};

  ${({ joined = true }) =>
    joined &&
    css`
      background-image: ${({ theme }) =>
        `url(${bgimg}),
        linear-gradient(to right, ${rgba(theme.apr, 0.12)}, ${rgba(theme.apr, 0.12)}),
        linear-gradient(to right, ${theme.buttonBlack}, ${theme.buttonBlack})`};

      background-size: cover, cover, cover;
      background-repeat: no-repeat, no-repeat, no-repeat;
    `}
  position: relative;
  transition: transform 0.6s;
  transform-style: preserve-3d;

  transform: rotateY(${({ flip }) => (flip ? '-180deg' : '0')});
`

export const FlipCardFront = styled.div`
  display: flex;
  height: 100%;
  flex-direction: column;
  backface-visibility: hidden;
`

export const FlipCardBack = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  backface-visibility: hidden;
  transform: rotateY(180deg);
`

export const Button = styled(ButtonLight)<{ color: string }>`
  background: ${({ color }) => color + '33'};
  color: ${({ color }) => color};
  height: 36px;
  font-size: 12px;
  gap: 4px;
  width: fit-content;
  padding: 10px 12px;

  &:hover {
    background-color: ${({ color, disabled }) => !disabled && darken(0.03, `${color}33`)};
  }
  &:active {
    box-shadow: 0 0 0 1pt ${({ color, disabled }) => !disabled && darken(0.05, `${color}33`)};
    background-color: ${({ color, disabled }) => !disabled && darken(0.05, `${color}33`)};
  }
  :disabled {
    cursor: not-allowed;
    background-color: ${({ theme }) => `${theme.buttonGray}`};
    color: ${({ theme }) => theme.border};
    box-shadow: none;
    border: 1px solid transparent;
    outline: none;
  }
`
