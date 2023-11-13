import { Trans } from '@lingui/macro'
import Column from 'components/Column'
import UniswapXBrandMark from 'components/Logo/UniswapXBrandMark'
import { RowBetween, RowFixed } from 'components/Row'
import Toggle from 'components/Toggle'
import { useAppDispatch } from 'state/hooks'
import { RouterPreference } from 'state/routing/types'
import { useRouterPreference } from 'state/user/hooks'
import { updateOptedOutOfUniswapX } from 'state/user/reducer'
import styled from 'styled-components'
import { ExternalLink, ThemedText } from 'theme/components'

const InlineLink = styled(ThemedText.BodySmall)`
  color: ${({ theme }) => theme.accent1};
  display: inline;
  cursor: pointer;
  &:hover {
    opacity: 0.8;
  }
`

export default function RouterPreferenceSettings() {
  const [routerPreference, setRouterPreference] = useRouterPreference()
  const dispatch = useAppDispatch()

  return (
    <RowBetween gap="sm">
      <RowFixed>
        <Column gap="xs">
          <ThemedText.BodySecondary>
            <UniswapXBrandMark />
          </ThemedText.BodySecondary>
          <ThemedText.BodySmall color="neutral2">
            <Trans>When available, aggregates liquidity sources for better prices and gas free swaps.</Trans>{' '}
            <ExternalLink href="https://support.uniswap.org/hc/en-us/articles/17515415311501">
              <InlineLink>Learn more</InlineLink>
            </ExternalLink>
          </ThemedText.BodySmall>
        </Column>
      </RowFixed>
      <Toggle
        id="toggle-uniswap-x-button"
        // If UniswapX-by-default is enabled we need to render this as active even if routerPreference === RouterPreference.API
        // because we're going to default to the UniswapX quote.
        // If the user manually toggles it off, this doesn't apply.
        isActive={routerPreference === RouterPreference.X}
        toggle={() => {
          if (routerPreference === RouterPreference.X) {
            // We need to remember if a opts out of UniswapX, so we don't request UniswapX quotes.
            dispatch(updateOptedOutOfUniswapX({ optedOutOfUniswapX: true }))
          }
          setRouterPreference(routerPreference === RouterPreference.X ? RouterPreference.API : RouterPreference.X)
        }}
      />
    </RowBetween>
  )
}
