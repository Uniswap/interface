import styled from 'styled-components/macro'

const Rule = styled.hr<{ padded?: true; scrollingEdge?: 'top' | 'bottom' }>`
  border: none;
  border-bottom: 1px solid ${({ theme }) => theme.backgroundOutline};
  margin: 0 ${({ padded }) => (padded ? '0.75rem' : 0)};
  margin-bottom: ${({ scrollingEdge }) => (scrollingEdge === 'bottom' ? -1 : 0)}px;
  margin-top: ${({ scrollingEdge }) => (scrollingEdge !== 'bottom' ? -1 : 0)}px;

  max-width: auto;
  width: auto;
`

export default Rule
