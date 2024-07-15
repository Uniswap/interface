import { Percent } from '@uniswap/sdk-core'
import { RowBetween } from 'components/Row'
import SettingsTab from 'components/Settings'
import { useAccount } from 'hooks/useAccount'
import { Trans } from 'i18n'
import styled, { useTheme } from 'lib/styled-components'
import { ReactNode } from 'react'
import { ArrowLeft } from 'react-feather'
import { Link, useLocation } from 'react-router-dom'
import { Box } from 'rebass'
import { useAppDispatch } from 'state/hooks'
import { resetMintState } from 'state/mint/actions'
import { resetMintState as resetMintV3State } from 'state/mint/v3/actions'
import { ThemedText } from 'theme/components'
import { flexRowNoWrap } from 'theme/styles'

const Tabs = styled.div`
  ${flexRowNoWrap};
  align-items: center;
  border-radius: 3rem;
  justify-content: space-evenly;
`

const StyledLink = styled(Link)<{ flex?: string }>`
  flex: ${({ flex }) => flex ?? 'none'};
  display: flex;
  align-items: center;

  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToMedium`
    flex: none;
    margin-right: 10px;
  `};
`

const FindPoolTabsText = styled(ThemedText.H1Small)`
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
`

const StyledArrowLeft = styled(ArrowLeft)`
  color: ${({ theme }) => theme.neutral1};
`

export function FindPoolTabs({ origin }: { origin: string }) {
  return (
    <Tabs>
      <RowBetween style={{ padding: '1rem 1rem 0 1rem', position: 'relative' }}>
        <Link to={origin}>
          <StyledArrowLeft />
        </Link>
        <FindPoolTabsText>
          <Trans i18nKey="pool.import.v2" />
        </FindPoolTabsText>
      </RowBetween>
    </Tabs>
  )
}

const AddRemoveTitleText = styled(ThemedText.H1Small)<{ $center: boolean }>`
  flex: 1;
  margin: auto;
  text-align: ${({ $center }) => ($center ? 'center' : 'start')};
`

export function AddRemoveTabs({
  adding,
  creating,
  autoSlippage,
  positionID,
  children,
}: {
  adding: boolean
  creating: boolean
  autoSlippage: Percent
  positionID?: string
  showBackLink?: boolean
  children?: ReactNode
}) {
  const { chainId } = useAccount()
  const theme = useTheme()
  // reset states on back
  const dispatch = useAppDispatch()
  const { state } = useLocation()
  const location = useLocation()

  // detect if back should redirect to v3 or v2 pool page
  const poolLink = location.pathname.includes('add/v2')
    ? '/pools/v2'
    : '/pools' + (positionID ? `/${positionID.toString()}` : '')

  // If the 'from' state is set by the previous page route back to the previous page, if not, route back to base pool
  const target = state?.from ?? poolLink

  return (
    <Tabs>
      <RowBetween style={{ padding: '1rem 1rem 0 1rem' }} align="center">
        <StyledLink
          to={target}
          onClick={() => {
            if (adding) {
              // not 100% sure both of these are needed
              dispatch(resetMintState())
              dispatch(resetMintV3State())
            }
          }}
          flex={children ? '1' : undefined}
        >
          <StyledArrowLeft stroke={theme.neutral2} />
        </StyledLink>
        <AddRemoveTitleText $center={!children}>
          {creating ? (
            <Trans i18nKey="pool.create.pair" />
          ) : adding ? (
            <Trans i18nKey="common.addLiquidity" />
          ) : (
            <Trans i18nKey="pool.removeLiquidity" />
          )}
        </AddRemoveTitleText>
        {children && <Box style={{ marginRight: '.5rem' }}>{children}</Box>}
        <SettingsTab autoSlippage={autoSlippage} chainId={chainId} hideRoutingSettings />
      </RowBetween>
    </Tabs>
  )
}
