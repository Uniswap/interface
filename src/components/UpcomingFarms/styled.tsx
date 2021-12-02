import styled from 'styled-components'

export const TableWrapper = styled.div`
  background: ${({ theme }) => theme.background};
  border-radius: 8px;
`

export const TableHeader = styled.div<{ fade?: boolean; oddRow?: boolean }>`
  display: grid;
  grid-gap: 3rem;
  grid-template-columns: repeat(5, 1fr);
  grid-template-areas: 'pools startingIn network rewards information';
  padding: 18px 24px 18px 24px;
  font-size: 12px;
  align-items: center;
  height: fit-content;
  position: relative;
  opacity: ${({ fade }) => (fade ? '0.6' : '1')};
  background-color: ${({ theme }) => theme.tableHeader};
  border-radius: 8px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    grid-gap: 1rem;
  `};

  ${({ theme }) => theme.mediaWidth.upToMedium`
    grid-gap: 1.5rem;
  `};

  ${({ theme }) => theme.mediaWidth.upToLarge`
    grid-gap: 1.5rem;
  `};
`

export const RowsWrapper = styled.div`
  padding: 24px 20px;

  @media only screen and (min-width: 1000px) {
    padding: 0 24px;
  }
`

export const TableRow = styled.div<{ isLastItem?: boolean }>`
  display: grid;
  grid-gap: 3rem;
  grid-template-columns: repeat(5, 1fr);
  grid-template-areas: 'pools startingIn network rewards information';
  padding: 16px 0;
  font-size: 14px;
  align-items: center;
  height: fit-content;
  position: relative;
  background-color: ${({ theme }) => theme.background};
  border: 1px solid transparent;
  border-bottom: ${({ theme, isLastItem }) => (isLastItem ? 'none' : `1px solid ${theme.border}`)};

  ${({ theme }) => theme.mediaWidth.upToSmall`
    grid-gap: 1rem;
  `};

  ${({ theme }) => theme.mediaWidth.upToMedium`
    grid-gap: 1.5rem;
  `};

  ${({ theme }) => theme.mediaWidth.upToLarge`
    grid-gap: 1.5rem;
  `};

  &:hover {
    cursor: pointer;
  }
`

export const StyledImg = styled.img`
  margin-right: 8px;
  background: #fff;
  border-radius: 50%;
  object-fit: contain;
`

export const HigherLogo = styled(StyledImg)`
  z-index: 2;
`
export const CoveredLogo = styled(StyledImg)`
  position: absolute;
  left: 12px !important;
`

export const PoolTokensWrapper = styled.div`
  position: relative;
  display: flex;
`

export const PoolTokensText = styled.div`
  margin-left: 12px;
  font-size: 14px;
  font-weight: 400;
  color: ${({ theme }) => theme.text};
`

export const NetworkLabel = styled.span`
  color: ${({ theme }) => theme.text};
  font-size: 14px;
  font-weight: 500;
`

export const NoFarmsWrapper = styled.div`
  text-align: center;
  padding-top: 20px;

  @media only screen and (min-width: 1000px) {
    padding-top: 32px;
  }
`

export const NoFarmsMessage = styled.div`
  font-size: 24px;
  font-weight: 400;
  color: ${({ theme }) => theme.text};
  margin-bottom: 40px;

  @media only screen and (min-width: 1000px) {
    font-size: 36px;
  }
`

export const StyledItemCard = styled.div<{ isLastItem?: boolean }>`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-column-gap: 4px;
  border: ${({ theme }) => `1px solid ${theme.border}`};
  border-radius: 8px;
  margin-bottom: ${({ isLastItem }) => (isLastItem ? '0' : '24px')};
  padding: 8px 20px 4px 20px;
  background-color: ${({ theme }) => theme.background};
  box-shadow: 0px 0px 8px 2px rgba(0, 0, 0, 0.06);
`
