import { GrgIcon } from 'nft/components/icons'
import styled from 'styled-components'
// ESLint reports `fill` is missing, whereas it exists on an SVGProps type
export type SVGProps = React.SVGProps<SVGSVGElement> & {
  fill?: string
  clickable?: boolean
}

export const UniIcon = ({ clickable /*, ...props*/ }: SVGProps) => (
  <Container clickable={clickable}>
    <GrgIcon />
  </Container>
)
