import styled from 'styled-components'
import { rgba } from 'polished'

export const PaginationContainer = styled.ul`
  display: flex;
  justify-content: center;
  list-style-type: none;
  background: ${({ theme }) => theme.background};
  margin: 0;
  padding: 16px;
`

export const PaginationItem = styled.li<{ $disabled?: boolean; $selected?: boolean }>`
  text-align: center;
  margin: auto 2px;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 36px;
  color: ${({ theme, $selected }) => ($selected ? theme.primary : theme.subText)};

  ${({ $disabled }) =>
    $disabled &&
    `
     opacity: 0.5;
     pointer-events: none
  `}

  ${({ $selected }) =>
    $selected &&
    `
     pointer-events: none
  `}
`

export const PaginationButton = styled.div<{ active?: boolean }>`
  width: 36px;
  height: 36px;
  display: flex !important;
  justify-content: center;
  align-items: center;
  cursor: pointer;

  color: ${({ theme, active }) => (active ? theme.primary : theme.subText)};
  background: ${({ theme, active }) => (active ? theme.buttonBlack : rgba(theme.buttonBlack, 0.4))};
  padding: 0;
  border-radius: 50%;
`
