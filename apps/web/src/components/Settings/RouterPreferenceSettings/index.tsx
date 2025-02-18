import UniswapXBrandMark from 'components/Logo/UniswapXBrandMark'
import Column from 'components/deprecated/Column'
import { RowBetween, RowFixed } from 'components/deprecated/Row'
import styled from 'lib/styled-components'
import { Trans } from 'react-i18next'
import { RouterPreference } from 'state/routing/types'
import { useRouterPreference } from 'state/user/hooks'
import { ExternalLink, ThemedText } from 'theme/components'
import { Switch } from 'ui/src'

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

  return (
    <RowBetween gap="sm">
      <RowFixed>
        <Column gap="xs">
          <ThemedText.BodySecondary>
            <UniswapXBrandMark />
          </ThemedText.BodySecondary>
          <ThemedText.BodySmall color="neutral2">
            <Trans i18nKey="routing.aggregateLiquidity" />{' '}
            <ExternalLink href="https://support.uniswap.org/hc/en-us/articles/17515415311501">
              <InlineLink>Learn more</InlineLink>
            </ExternalLink>
          </ThemedText.BodySmall>
        </Column>
      </RowFixed>
      <Switch
        testID="toggle-uniswap-x-button"
        checked={routerPreference === RouterPreference.X}
        variant="branded"
        onCheckedChange={() => {
          setRouterPreference(routerPreference === RouterPreference.X ? RouterPreference.API : RouterPreference.X)
        }}
      />
    </RowBetween>
  )
}
