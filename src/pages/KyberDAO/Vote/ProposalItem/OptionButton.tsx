import { t } from '@lingui/macro'
import { rgba } from 'polished'
import { CheckSquare, Square } from 'react-feather'
import { Text } from 'rebass'
import styled, { css, keyframes } from 'styled-components'

import RadioButtonChecked from 'components/Icons/RadioButtonChecked'
import RadioButtonUnchecked from 'components/Icons/RadioButtonUnchecked'
import { RowBetween, RowFit } from 'components/Row'
import { MouseoverTooltip } from 'components/Tooltip'

const Wrapper = styled.div<{ type?: 'Finished' | 'Active' | 'Choosing' | 'Pending'; disabled?: boolean }>`
  border-radius: 4px;
  overflow: hidden;
  position: relative;
  min-height: 36px;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  user-select: none;
  ${({ theme }) => css`
    background-color: ${theme.buttonBlack};
  `};
  ${({ type, theme }) =>
    type === 'Pending' &&
    css`
      color: ${theme.subText};
      background-color: ${theme.buttonBlack};
    `}
  ${({ disabled }) =>
    !disabled &&
    css`
      cursor: pointer;

      :hover {
        filter: brightness(1.1);
      }
    `}
`
const move = keyframes`
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 50px 0;
  }
`
const FinishedProgress = styled.div<{ width: number }>`
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  border-radius: 4px;
  width: ${({ width }) => width || 0}%;
  background-color: ${({ theme }) => rgba(theme.primary, 0.2)};
  z-index: 0;
`
const ActiveProgress = styled.div<{ width: number }>`
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  border-radius: 4px;
  width: ${({ width }) => width || 0}%;
  background-color: ${({ theme }) => theme.primary};
  z-index: 0;
`
const ChoosingProgress = styled.div<{ width: number }>`
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  border-radius: 4px;
  width: 100%;
  background-color: ${({ theme }) => theme.darkerGreen};
  z-index: 0;
  ::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    background-image: linear-gradient(
      -45deg,
      rgba(0, 0, 0, 0.1) 28%,
      transparent 28%,
      transparent 50%,
      rgba(0, 0, 0, 0.1) 50%,
      rgba(0, 0, 0, 0.1) 78%,
      transparent 78%,
      transparent
    );
    background-size: 25px 25px;
    animation: ${move} 1.5s linear infinite;
  }
`
const CheckButtonWrapper = styled.div`
  width: 18px;
  > svg {
    display: block;
  }
`

export default function OptionButton({
  checked,
  percent = 40,
  title,
  type = 'Finished',
  onOptionClick,
  isCheckBox,
  disabled,
  id,
}: {
  checked?: boolean
  percent?: number
  title?: string
  type?: 'Finished' | 'Active' | 'Choosing' | 'Pending'
  onOptionClick?: () => void
  isCheckBox: boolean
  disabled?: boolean
  id: number
}) {
  const parsedPercent = parseFloat(percent.toFixed(2) || '0')
  return (
    <Wrapper onClick={() => !disabled && onOptionClick?.()} disabled={disabled} type={type}>
      <div style={{ zIndex: 4, width: '100%' }}>
        <RowBetween style={{ zIndex: 1 }} alignItems="center">
          <MouseoverTooltip
            text={type === 'Pending' && t`Cannot vote at this moment`}
            placement="top"
            width="fit-content"
          >
            <RowFit gap="5px" style={{ fontSize: '12px', overflow: 'hidden', wordBreak: 'break-word' }}>
              <CheckButtonWrapper style={{ width: '18px' }}>
                {isCheckBox ? (
                  checked ? (
                    <CheckSquare size={18} />
                  ) : (
                    <Square size={18} />
                  )
                ) : checked ? (
                  <RadioButtonChecked />
                ) : (
                  <RadioButtonUnchecked />
                )}{' '}
              </CheckButtonWrapper>
              <Text>{`${id}. ${title}`}</Text>
            </RowFit>
          </MouseoverTooltip>
          <Text fontSize="12px" padding={'0 4px'}>
            {parsedPercent}%
          </Text>
        </RowBetween>
      </div>

      {type === 'Active' && <ActiveProgress width={percent} />}
      {type === 'Choosing' && <ChoosingProgress width={percent} />}
      {type === 'Finished' && <FinishedProgress width={percent} />}
    </Wrapper>
  )
}
