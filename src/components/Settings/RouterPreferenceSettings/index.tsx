import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import Column from 'components/Column'
import UniswapXBrandMark from 'components/Logo/UniswapXBrandMark'
import { RowBetween, RowFixed } from 'components/Row'
import Toggle from 'components/Toggle'
import { isUniswapXSupportedChain } from 'constants/chains'
import { useUniswapXEnabled } from 'featureFlags/flags/uniswapx'
import { useAppDispatch } from 'state/hooks'
import { RouterPreference } from 'state/routing/slice'
import { useRouterPreference } from 'state/user/hooks'
import { updateDisabledUniswapX } from 'state/user/reducer'
import styled from 'styled-components/macro'
import { Divider, ExternalLink, ThemedText } from 'theme'

const InlineLink = styled(ThemedText.Caption)`
  color: ${({ theme }) => theme.accentAction};
  display: inline;
  cursor: pointer;
  &:hover {
    opacity: 0.8;
  }
`

export default function RouterPreferenceSettings() {
  const { chainId } = useWeb3React()
  const [routerPreference, setRouterPreference] = useRouterPreference()
  const uniswapXEnabled = useUniswapXEnabled() && chainId && isUniswapXSupportedChain(chainId)
  const dispatch = useAppDispatch()

  return (
    <>
      {uniswapXEnabled && (
        <>
          <RowBetween gap="sm">
            <RowFixed>
              <Column gap="xs">
                <ThemedText.BodySecondary>
                  <UniswapXBrandMark />
                </ThemedText.BodySecondary>
                <ThemedText.Caption color="textSecondary">
                  <Trans>When available, aggregates liquidity sources for better prices and gas free swaps.</Trans>{' '}
                  <ExternalLink href="https://support.uniswap.org/hc/en-us/articles/17515415311501">
                    <InlineLink>Learn more</InlineLink>
                  </ExternalLink>
                </ThemedText.Caption>
              </Column>
            </RowFixed>
            <Toggle
              id="toggle-uniswap-x-button"
              isActive={routerPreference === RouterPreference.X}
              toggle={() => {
                if (routerPreference === RouterPreference.X) {
                  // We need to remember if a user disables Uniswap X, so we don't show the opt-in flow again.
                  dispatch(updateDisabledUniswapX({ disabledUniswapX: true }))
                }
                setRouterPreference(routerPreference === RouterPreference.X ? RouterPreference.API : RouterPreference.X)
              }}
            />
          </RowBetween>
          <Divider />
        </>
      )}
      <RowBetween gap="sm">
        <RowFixed>
          <Column gap="xs">
            <ThemedText.BodySecondary>
              <Trans>Local routing</Trans>
            </ThemedText.BodySecondary>
          </Column>
        </RowFixed>
        <Toggle
          id="toggle-local-routing-button"
          isActive={routerPreference === RouterPreference.CLIENT}
          toggle={() =>
            setRouterPreference(
              routerPreference === RouterPreference.CLIENT ? RouterPreference.API : RouterPreference.CLIENT
            )
          }
        />
      </RowBetween>
    </>
  )
}
