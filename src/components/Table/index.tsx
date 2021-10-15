import styled from 'styled-components'

export const Table = styled.table`
  width: 100%;
  margin: 0;
  padding: 0;
`

export const Th = styled.th<{ align?: string }>`
  padding: 0 9px;
  font-size: 10px;
  font-weight: 600;
  line-height: 12px;
  text-transform: uppercase;
  text-align: ${({ align }) => align || 'left'};
  color: ${props => props.theme.purple3};

  &:first-child,
  &:last-child {
    padding: 0;
  }
`

export const Td = styled.td<{ isActive?: boolean }>`
  padding: 9px 10px;
  text-align: right;
  background: rgba(104, 110, 148, 0.16);
  border-width: 1px 0;
  border-style: solid;
  border-color: ${({ isActive }) => (isActive ? 'rgba(120, 115, 164, 0.5)' : 'transparent')};

  &:first-child {
    text-align: left;
    border-top-left-radius: 8px;
    border-bottom-left-radius: 8px;
    border-left-width: 1px;
  }

  &:last-child {
    text-align: left;
    border-top-right-radius: 8px;
    border-bottom-right-radius: 8px;
    border-right-width: 1px;
  }
`
