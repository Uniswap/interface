import { Trans } from '@lingui/macro'
import Column from 'components/Column'
import Radio from 'components/Radio'
import Row, { RowBetween, RowFixed } from 'components/Row'
import Toggle from 'components/Toggle'
import { RouterPreference } from 'state/routing/slice'
import { useRouterPreference } from 'state/user/hooks'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

const Preference = styled(Row)`
  background-color: ${({ theme }) => theme.backgroundModule};
  padding: 12px 16px;
`

const PreferencesContainer = styled(Column)`
  gap: 1.5px;
  border-radius: 12px;
  overflow: hidden;
`

export default function RouterPreferenceSettings() {
  const [routerPreference, setRouterPreference] = useRouterPreference()

  const isAutoRoutingActive = routerPreference === RouterPreference.PRICE

  return (
    <Column gap="md">
      <RowBetween>
        <RowFixed>
          <Column gap="xs">
            <ThemedText.BodySecondary>
              <Trans>Auto Routing</Trans>
            </ThemedText.BodySecondary>
            <ThemedText.Caption color="textSecondary">
              <Trans>Finds the best route across liquidity sources.</Trans>
            </ThemedText.Caption>
          </Column>
        </RowFixed>
        <Toggle
          id="toggle-optimized-router-button"
          isActive={isAutoRoutingActive}
          toggle={() => setRouterPreference(isAutoRoutingActive ? RouterPreference.API : RouterPreference.PRICE)}
        />
      </RowBetween>
      {!isAutoRoutingActive && (
        <PreferencesContainer>
          <Preference>
            <Column gap="xs">
              <ThemedText.BodyPrimary>
                <Trans>Uniswap API</Trans>
              </ThemedText.BodyPrimary>
              <ThemedText.Caption color="textSecondary">
                <Trans>Finds the best route on the Uniswap Protocol using the Uniswap Labs Routing API.</Trans>
              </ThemedText.Caption>
            </Column>
            <Radio
              isActive={routerPreference === RouterPreference.API}
              toggle={() => setRouterPreference(RouterPreference.API)}
            />
          </Preference>
          <Preference>
            <Column gap="xs">
              <ThemedText.BodyPrimary>
                <Trans>Uniswap client</Trans>
              </ThemedText.BodyPrimary>
              <ThemedText.Caption color="textSecondary">
                <Trans>
                  Finds the best route on the Uniswap Protocol through your browser. May result in high latency and
                  prices.
                </Trans>
              </ThemedText.Caption>
            </Column>
            <Radio
              isActive={routerPreference === RouterPreference.CLIENT}
              toggle={() => setRouterPreference(RouterPreference.CLIENT)}
            />
          </Preference>
        </PreferencesContainer>
      )}
    </Column>
  )
}
