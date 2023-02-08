import { Flex } from 'rebass'
import styled, { css } from 'styled-components'

import { ButtonOutlined } from 'components/Button'
import { AutoColumn } from 'components/Column'
import Input from 'components/NumericalInput'

export const PageWrapper = styled(AutoColumn)`
  padding: 0 2rem 1rem;
  width: 100%;
  max-width: calc(1500px + 2rem * 2);

  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 0 12px;
    max-width: calc(500px + 12px * 2);
  `};
`
export const Container = styled.div`
  width: 100%;
  border-radius: 20px;
  border: 1px solid ${({ theme }) => theme.border};
  background: ${({ theme }) => theme.background};
  display: flex;
  flex-direction: column;
  padding: 24px;
  gap: 24px;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 16px;
    gap: 16px;
  `};
`

export const DynamicSection = styled(AutoColumn)<{ disabled?: boolean }>`
  opacity: ${({ disabled }) => (disabled ? '0.2' : '1')};
  pointer-events: ${({ disabled }) => (disabled ? 'none' : 'initial')};
`

export const StyledInput = styled(Input)`
  background-color: ${({ theme }) => theme.buttonBlack};
  text-align: left;
  font-size: 24px;
  width: 100%;
`

export const RightContainer = styled(AutoColumn)`
  height: fit-content;
  min-width: 600px;
  width: 100%;
  gap: 0;
  ${({ theme }) => theme.mediaWidth.upToLarge`
    min-width: 450px;
  `};
`

export const ChartWrapper = styled.div`
  border-radius: 20px;
  overflow: hidden;
  background-color: ${({ theme }) => theme.buttonBlack};
  height: 100%;
  width: 100%;
`

export const ChartBody = styled.div`
  background-color: ${({ theme }) => theme.buttonBlack};
  padding: 16px;
  width: 100%;
`

export const FlexLeft = styled(Flex)`
  flex-shrink: 0;
  flex-direction: column;
  gap: 24px;

  width: calc(100vw / 26 * 9 - 64px);
  max-width: 425px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    width: 100%;
    max-width: 500px;
  `};
`

export const StackedContainer = styled.div`
  display: grid;
`

export const StackedItem = styled.div<{ zIndex?: number }>`
  grid-column: 1;
  grid-row: 1;
  height: 100%;
  z-index: ${({ zIndex }) => zIndex};
`

export const RangeBtn = styled(ButtonOutlined)<{ isSelected: boolean }>`
  width: 100%;
  padding-top: 8px;
  padding-bottom: 8px;
  ${({ isSelected, theme }) =>
    isSelected
      ? css`
          border-color: ${theme.primary};
          color: ${theme.primary};
          box-shadow: none;
          &:focus {
            box-shadow: none;
          }
          &:hover {
            box-shadow: none;
          }
          &:active {
            box-shadow: none;
          }
        `
      : ''}
`

export const ArrowWrapper = styled.div<{ rotated?: boolean; isVertical?: boolean; size?: number }>`
  display: flex;
  justify-content: center;
  align-items: center;
  width: fit-content;
  height: fit-content;
  cursor: pointer;
  border-radius: 999px;

  transform: rotate(
    ${({ rotated, isVertical }) => {
      if (isVertical) return rotated ? '270deg' : '90deg'
      return rotated ? '180deg' : '0'
    }}
  );
  transition: transform 300ms;
  :hover {
    opacity: 0.8;
  }
`
