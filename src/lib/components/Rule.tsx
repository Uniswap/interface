import styled from 'lib/theme'

const Rule = styled.hr<{ padded?: true; scrollingEdge?: 'top' | 'bottom' }>`
  border: none;
  border-bottom: 1px solid ${({ theme }) => theme.outline};
  margin: 0 ${({ padded }) => (padded ? '0.75em' : 0)};
  margin-bottom: ${({ scrollingEdge }) => (scrollingEdge === 'bottom' ? -1 : 0)}px;
  margin-top: ${({ scrollingEdge }) => (scrollingEdge !== 'bottom' ? -1 : 0)}px;

  // Integrators will commonly modify hr width - this overrides any modifications within the widget.
  max-width: auto;
  width: auto;
`

export default Rule
