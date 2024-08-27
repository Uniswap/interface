import { GrgIcon } from 'nft/components/icons'
import styled from 'styled-components'

const Container = styled.div<{ clickable?: boolean }>`
  position: relative;
  cursor: ${({ clickable }) => (clickable ? 'pointer' : 'auto')};
`

// ESLint reports `fill` is missing, whereas it exists on an SVGProps type
export type SVGProps = React.SVGProps<SVGSVGElement> & {
  fill?: string
}

export const UniIcon = ({ clickable /*, ...props*/ }: SVGProps) => (
  <Container clickable={clickable}>
    <GrgIcon />
  </Container>
)
