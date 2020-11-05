import styled from 'styled-components'

export const Wrapper = styled.div`
  position: relative;
`

export const ModalSection = styled.div<{ light?: boolean }>`
  padding: 1rem;
  ${({ light }) => (light ? 'background-color: rgb(44, 47, 54)' : null)};
`

export const UnsupportedTokenContainer = styled.div`
  padding: 1rem;
`

export const ArrowWrapper = styled.div`
  padding: 0.75rem;
`

export const BottomGrouping = styled.div`
  margin-top: 2rem;
`

export const Logo = styled.img`
  width: 100px;
`

export const Loader = styled.img`
  margin-right: 5px;
`
