import { transparentize } from 'polished'
import { useState } from 'react'
import { Text } from 'rebass'
import styled, { CSSProperties, css } from 'styled-components'

import { ReactComponent as Alert } from 'assets/images/alert.svg'
import { ButtonEmpty } from 'components/Button'
import { AutoColumn } from 'components/Column'
import Modal, { ModalProps } from 'components/Modal'
import { Z_INDEXS } from 'constants/styles'
import useTheme from 'hooks/useTheme'
import { errorFriendly } from 'utils/dmm'

export const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: 24px 36px;
  gap: 24px;
  width: 100%;
  max-width: 1464px;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    height: unset;
`}
  ${({ theme }) => theme.mediaWidth.upToSmall`
    gap: 16px;
    padding: 20px 16px;
`};
`

export const TabContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;

  @media only screen and (min-width: 768px) {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
`

export const TabWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  @media only screen and (min-width: 768px) {
    margin-bottom: 0;
  }
`

export const Tab = styled(ButtonEmpty)<{ isActive: boolean }>`
  width: fit-content;
  margin-right: 1.5rem;
  font-weight: 400;
  padding: 0;
  padding-bottom: 4px;
  color: ${({ theme, isActive }) => (isActive ? theme.primary : theme.subText)};
  position: relative;
  border-radius: 0;

  &:hover {
    text-decoration: none;
  }

  &:focus {
    text-decoration: none;
  }

  &:last-child {
    margin-right: 0;
  }

  ${({ theme }) => theme.mediaWidth.upToSmall`
    margin-right: 12px;
  `}
`

export const BetaTag = styled.span`
  font-size: 10px;
  color: ${({ theme }) => theme.subText};
  position: absolute;
  top: 4px;
  right: -38px;
  padding: 2px 6px;
  background-color: ${({ theme }) => theme.buttonGray};
  border-radius: 10px;
`

export const Container = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: center;
  width: 100%;
  max-width: 1392px;
  gap: 48px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    gap: 24px;
    flex-direction: column;
    align-items: center;
  `}
  ${({ theme }) => theme.mediaWidth.upToSmall`
    gap: 16px;
  `}
`

export const Wrapper = styled.div`
  position: relative;
  z-index: 1;
  background: ${({ theme }) => theme.background};
`

export const BottomGrouping = styled.div`
  margin-top: 24px;
`

export const StyledBalanceMaxMini = styled.button`
  height: 22px;
  width: 22px;
  background-color: transparent;
  border: none;
  border-radius: 50%;
  padding: 0.2rem;
  font-size: 0.875rem;
  font-weight: 400;
  margin-left: 0.25rem;
  cursor: pointer;
  color: ${({ theme }) => theme.text2};
  display: flex;
  justify-content: center;
  align-items: center;
  float: right;

  :hover {
    background-color: ${({ theme }) => theme.bg3};
  }
  :focus {
    background-color: ${({ theme }) => theme.bg3};
    outline: none;
  }
`

export const TruncatedText = styled(Text)`
  text-overflow: ellipsis;
  width: 220px;
  overflow: hidden;
`

// styles
export const Dots = styled.span`
  &::after {
    display: inline-block;
    animation: ellipsis 1.25s infinite;
    content: '.';
    width: 1em;
    text-align: left;
  }
  @keyframes ellipsis {
    0% {
      content: '.';
    }
    33% {
      content: '..';
    }
    66% {
      content: '...';
    }
  }
`

const SwapCallbackErrorInner = styled.div`
  background-color: ${({ theme }) => transparentize(0.9, theme.red1)};
  border-radius: 1rem;
  display: flex;
  align-items: center;
  font-size: 0.825rem;
  width: 100%;
  margin-top: 36px;
  padding: 8px 20px 8px 8px;
  background-color: ${({ theme }) => `${theme.buttonBlack}66`};
  z-index: -1;
  p {
    padding: 0;
    margin: 0;
    font-weight: 500;
  }
`

export function SwapCallbackError({ error, style = {} }: { error: string; style?: CSSProperties }) {
  const theme = useTheme()
  const [showDetail, setShowDetail] = useState<boolean>(false)
  return (
    <SwapCallbackErrorInner style={style}>
      <Alert style={{ marginBottom: 'auto' }} />
      <AutoColumn style={{ flexBasis: '100%', margin: '10px 0 auto 8px' }}>
        <Text fontSize="16px" fontWeight="500" color={theme.red} lineHeight={'24px'}>
          {errorFriendly(error)}
        </Text>
        {error !== errorFriendly(error) && (
          <Text
            color={theme.primary}
            fontSize="12px"
            sx={{ cursor: `pointer` }}
            onClick={() => setShowDetail(!showDetail)}
          >
            Show more details
          </Text>
        )}
        {showDetail && (
          <Text
            color={theme.text}
            fontSize="10px"
            margin="10px 0 4px 0"
            lineHeight="16px"
            sx={{ wordBreak: 'break-word' }}
          >
            {typeof error === 'string' ? error : JSON.stringify(error)}
          </Text>
        )}
      </AutoColumn>
    </SwapCallbackErrorInner>
  )
}

export const SwapShowAcceptChanges = styled(AutoColumn)`
  background-color: ${({ theme }) => transparentize(0.9, theme.primary)};
  color: ${({ theme }) => theme.primary};
  padding: 0.5rem;
  border-radius: 12px;
  margin-top: 8px;
`

export const GroupButtonReturnTypes = styled.div`
  display: flex;
  margin-top: 20px;
  border-radius: 999px;
  background: ${({ theme }) => theme.tabBackgound};
  padding: 2px;
`

export const ButtonReturnType = styled.div<{ active?: boolean }>`
  border-radius: 999px;
  flex: 1;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme, active }) => (active ? theme.tabActive : theme.tabBackgound)};
  color: ${({ theme, active }) => (active ? theme.text : theme.subText)};
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: color 300ms;
`

export const SwapFormActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`

export const KyberTag = styled.div`
  position: absolute;
  align-items: center;
  display: flex;
  top: 12px;
  left: 12px;
  font-weight: 500;
  color: ${({ theme }) => theme.apr};
  font-size: 0.75rem;
  z-index: 2;
`

export const PriceImpactHigh = styled.div<{ veryHigh?: boolean }>`
  border-radius: 999px;
  padding: 12px 16px;
  background: ${({ theme, veryHigh }) => (veryHigh ? `${theme.red}66` : `${theme.warning}66`)};
  margin-top: 28px;
  display: flex;
  align-items: center;
  font-size: 12px;
`

export const SwapFormWrapper = styled.div<{ isShowTutorial?: boolean }>`
  width: 425px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  gap: 16px;
  @media only screen and (min-width: 1100px) {
    position: ${({ isShowTutorial }) => (isShowTutorial ? 'unset' : 'sticky')};
    /**
      When tutorial appear, there is no need sticky form. 
      Besides, it is also easy for us control position of tutorial popup when scroll page. 
    */
    top: 16px;
  }

  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100%;
  `}
`

export const InfoComponentsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  width: calc(100% - 472px);

  ${({ theme }) => theme.mediaWidth.upToMedium`
    width: 100%;
  `};
`

export const LiveChartWrapper = styled.div`
  width: 100%;
  height: 510px;
  margin-bottom: 30px;
`

export const RoutesWrapper = styled(LiveChartWrapper)<{ isOpenChart: boolean }>`
  height: auto;
  margin-top: 4px;
`

export const TokenInfoWrapper = styled(LiveChartWrapper)`
  display: flex;
  flex-direction: column;
  row-gap: 16px;

  @media screen and (min-width: 1100px) {
    display: flex;
  }

  height: auto;
  border-bottom: none;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100%;
  `}
`

export const MobileModalWrapper = styled((props: ModalProps) => <Modal {...props} zindex={Z_INDEXS.MODAL} />)<{
  height?: string
}>`
  &[data-reach-dialog-content] {
    width: 100vw;
    max-width: 100vw;
    ${({ height }) => height && `height: ${height};`}
    min-height: 70vh;
  }
`

export const StyledActionButtonSwapForm = styled.button<{ active?: boolean; hoverBg?: string }>`
  position: relative;
  border: none;
  background-color: transparent;
  margin: 0;
  padding: 0;
  height: 36px;
  width: 36px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;

  :hover {
    cursor: pointer;
    outline: none;
    background-color: ${({ theme, hoverBg }) => hoverBg || theme.background};
  }

  ${({ active }) =>
    active
      ? css`
          cursor: pointer;
          outline: none;
          background-color: ${({ theme }) => theme.buttonBlack};
        `
      : ''}
`

export const IconButton = styled(StyledActionButtonSwapForm)<{ enableClickToRefresh: boolean }>`
  transition: background 0.2s;

  // off click
  &:hover {
    cursor: default;
    background-color: transparent;
  }
`
