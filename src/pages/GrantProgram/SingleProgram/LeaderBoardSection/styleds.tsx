import { rgba } from 'polished'
import styled from 'styled-components'

export const Container = styled.div`
  width: 532px;
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    width: 100%;
  `}

  display: flex;
  flex-direction: column;
  gap: 16px;
`

export const LoaderContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;

  display: flex;
  justify-content: center;
  align-items: center;

  user-select: none;
  border-radius: 20px;
  background: ${({ theme }) => rgba(theme.buttonGray, 0.8)};
`

export const TableWrapper = styled.div`
  width: 100%;
  padding: 20px;
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    padding: 16px 0;
  `}

  display: flex;
  flex-direction: column;
  background: ${({ theme }) => rgba(theme.buttonGray, 0.8)};
  border-radius: 20px;
`

export const Table = styled.div`
  display: flex;
  flex-direction: column;
  border-bottom: 1px solid ${({ theme }) => theme.border};
`

export const HeaderCell = styled.span<{ textAlign?: 'left' | 'center' | 'right' }>`
  font-weight: 500;
  font-size: 12px;
  line-height: 16px;
  color: ${({ theme }) => theme.subText};
  text-transform: uppercase;
  text-align: ${({ textAlign }) => textAlign || 'left'};
`

export const Row = styled.div<{ $background?: string }>`
  width: 100%;
  height: 60px;

  padding: 0 16px;
  background: ${({ $background }) => $background || 'unset'};

  display: grid;
  align-items: center;
  grid-template-columns: 48px 1fr 96px 24px;
  column-gap: 16px;
  border-top: 1px solid ${({ theme }) => theme.border};

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    column-gap: 8px;
  `}

  &[role="button"] {
    cursor: pointer;
  }
`

export const TableHeader = styled(Row)`
  height: 48px;
  border-top: none;

  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  background: ${({ theme }) => theme.tableHeader};

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    border-top-left-radius: 0px;
    border-top-right-radius: 0px;
  `}
`

export const Cell = styled.div<{ textAlign?: 'left' | 'center' | 'right' }>`
  font-size: 14px;
  line-height: 16px;
  font-weight: 400;
  text-align: ${({ textAlign }) => textAlign || 'left'};
  display: flex;
  justify-content: ${({ textAlign }) =>
    textAlign === 'right' ? 'flex-end' : textAlign === 'center' ? 'center' : 'flex-start'};

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    font-weight: 400;
    font-size: 12px;
    line-height: 20px;
  `}
`

export const MedalImg = styled.img`
  min-width: 18px;
`

export const RankByText = styled.span.attrs(() => ({
  role: 'button',
}))<{ active?: boolean }>`
  font-weight: 500;
  font-size: 20px;
  line-height: 24px;
  color: ${({ theme, active }) => (active ? theme.primary : theme.text)};
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
`

export const StyledLogo = styled.img`
  width: 100%;
  height: auto;
`

export const RankByWrapper = styled.div`
  display: flex;
  gap: 24px;
  overflow: auto;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    gap: 12px;
  `}
`

export const UtilityBar = styled.div`
  display: flex;
  width: 100%;
  margin-bottom: 16px;
  justify-content: center;
  gap: 16px;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    flex-wrap: wrap;
  `}
`
