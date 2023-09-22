import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import Column from 'components/Column'
import UniswapXBrandMark from 'components/Logo/UniswapXBrandMark'
import { RowBetween, RowFixed } from 'components/Row'
import Toggle from 'components/Toggle'
import { isUniswapXSupportedChain } from 'constants/chains'
import { useUniswapXDefaultEnabled } from 'featureFlags/flags/uniswapXDefault'
import { useAppDispatch } from 'state/hooks'
import { RouterPreference } from 'state/routing/types'
import { useRouterPreference, useUserOptedOutOfUniswapX } from 'state/user/hooks'
import { updateDisabledUniswapX, updateOptedOutOfUniswapX } from 'state/user/reducer'
import styled from 'styled-components'
import { Divider, ExternalLink, ThemedText } from 'theme/components'

const InlineLink = styled(ThemedText.BodySmall)`
  color: ${({ theme }) => theme.accent1};
  display: inline;
  cursor: pointer;
  &:hover {
    opacity: 0.8;
  }
`

export default function RouterPreferenceSettings() {
  const { chainId } = useWeb3React()
  const [routerPreference, setRouterPreference] = useRouterPreference()
  const uniswapXEnabled = chainId && isUniswapXSupportedChain(chainId)
  const dispatch = useAppDispatch()
  const userOptedOutOfUniswapX = useUserOptedOutOfUniswapX()
  const isUniswapXDefaultEnabled = useUniswapXDefaultEnabled()
  const isUniswapXOverrideEnabled = isUniswapXDefaultEnabled && !userOptedOutOfUniswapX

  const uniswapXInEffect =
    routerPreference === RouterPreference.X ||
    (routerPreference !== RouterPreference.CLIENT && isUniswapXOverrideEnabled)

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
              isActive={uniswapXInEffect}
              toggle={() => {
                if (uniswapXInEffect) {
                  if (isUniswapXDefaultEnabled) {
                    // We need to remember if a opts out of UniswapX, so we don't request UniswapX quotes.
                    dispatch(updateOptedOutOfUniswapX({ optedOutOfUniswapX: true }))
                  } else {
                    // We need to remember if a user disables Uniswap X, so we don't show the opt-in flow again.
                    dispatch(updateDisabledUniswapX({ disabledUniswapX: true }))
                  }
                }
                setRouterPreference(uniswapXInEffect ? RouterPreference.API : RouterPreference.X)
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
              routerPreference === RouterPreference.CLIENT
                ? isUniswapXDefaultEnabled
                  ? RouterPreference.X
                  : RouterPreference.API
                : RouterPreference.CLIENT
            )
          }
        />
      </RowBetween>
    </>
  )
}
