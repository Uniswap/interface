import { Trans } from '@lingui/macro'
import Row from 'lib/components/Row'
import { Logo } from 'lib/icons'
import styled, { brand, ThemedText } from 'lib/theme'

import ExternalLink from './ExternalLink'

const UniswapA = styled(ExternalLink)`
  color: ${({ theme }) => theme.secondary};
  cursor: pointer;
  text-decoration: none;

  ${Logo} {
    fill: ${({ theme }) => theme.secondary};
    height: 1em;
    transition: transform 0.25s ease, fill 0.25s ease;
    width: 1em;
    will-change: transform;
  }

  :hover ${Logo} {
    fill: ${brand};
    transform: rotate(-5deg);
  }
`

export default function BrandedFooter() {
  return (
    <Row justify="center">
      <UniswapA href={`https://app.uniswap.org/`}>
        <Row gap={0.25}>
          <Logo />
          <ThemedText.Caption>
            <Trans>Powered by the Uniswap protocol</Trans>
          </ThemedText.Caption>
        </Row>
      </UniswapA>
    </Row>
  )
}
