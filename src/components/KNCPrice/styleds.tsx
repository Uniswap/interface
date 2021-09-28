import styled from 'styled-components'
export const KNCPriceContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 5px;
  background-color: ${({ theme }) => theme.bg13};
  padding: 4px 10px 4px 8px;
  font-size: 14px;
  font-weight: normal;
`

export const KNCPriceWrapper = styled.div`
  display: flex;
  align-items: center;

  img {
    margin-right: 4px;
  }
`
