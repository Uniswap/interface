import styled from 'styled-components'
export const KNCPriceContainer = styled.div`
  position: absolute;
  top: 20px;
  left: 28px;
  border-radius: 5px;
  background-color: ${({ theme }) => theme.bg13};
  padding: 4px 10px 4px 8px;
  font-size: 14px;
  font-weight: normal;
  z-index: 99;

  ${({ theme }) => theme.mediaWidth.upToLarge`
  display: none;
`};
`

export const KNCPriceWrapper = styled.div`
  display: flex;
  align-items: center;
`
