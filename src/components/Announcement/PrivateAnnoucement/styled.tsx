import { rgba } from 'polished'
import styled, { css } from 'styled-components'

export const InboxItemWrapper = styled.div<{ isRead: boolean }>`
  border-bottom: 1px solid ${({ theme }) => theme.border};
  background-color: ${({ theme }) => theme.background};
  font-size: 12px;
  padding: 20px;
  gap: 8px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  cursor: pointer;
  ${({ isRead }) =>
    !isRead
      ? css`
          background-color: ${({ theme }) => rgba(theme.primary, 0.12)};
          :hover {
            background-color: ${({ theme }) => rgba(theme.primary, 0.2)};
          }
        `
      : css`
          :hover {
            background-color: ${({ theme }) => theme.buttonBlack};
          }
        `};
`

export const Title = styled.div<{ isRead: boolean }>`
  font-size: 12px;
  font-weight: 500;
  color: ${({ theme, isRead }) => (isRead ? theme.text : theme.primary)};
`

export const PrimaryText = styled.div<{ color?: string }>`
  font-size: 12px;
  color: ${({ theme, color }) => color ?? theme.text};
`
export const InboxItemTime = styled.span<{ color: string }>`
  color: ${({ theme, color }) => color ?? theme.border};
`
export const Dot = styled.span`
  background-color: ${({ theme }) => theme.primary};
  border-radius: 100%;
  height: 8px;
  width: 8px;
`

export const InboxItemRow = styled.div`
  justify-content: space-between;
  display: flex;
`
export const RowItem = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`
