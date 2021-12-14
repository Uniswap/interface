import styled from 'lib/theme'

function borderEdge({ scrollingEdge }: { scrollingEdge?: 'top' | 'bottom' }) {
  return scrollingEdge !== 'bottom' ? 'border-bottom' : 'border-top'
}

function marginEdge({ scrollingEdge }: { scrollingEdge?: 'top' | 'bottom' }) {
  return scrollingEdge !== 'bottom' ? 'margin-top' : 'margin-bottom'
}

/** A horizontal rule. The scrollingEdge defines the edge under which content scrolls. */
const Rule = styled.hr<{ padded?: true; scrollingEdge?: 'top' | 'bottom' }>`
  border: none;
  ${borderEdge}: 1px solid ${({ theme }) => theme.outline};
  margin: 0 ${({ padded }) => padded && '0.75em 0'};
  ${marginEdge}: -1px;
`

export default Rule
