import styled from 'styled-components'

export const ShareContentWrapper = styled.div`
  display: flex;
  width: 100%;
  height: 100%;
  flex-direction: column;
`

export const ShareWrapper = styled.div`
  display: flex;
  width: 100%;
  height: 100%;
  flex-direction: column;

  padding: 24px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    flex: 1;
    padding: 0;

    ${ShareContentWrapper} {
      flex: 1;
      padding: 0 16px;
    }
  `}
`
