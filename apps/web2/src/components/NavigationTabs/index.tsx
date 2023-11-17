import { Trans } from '@lingui/macro'
import { Percent } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import SettingsTab from 'components/Settings'
import { ReactNode } from 'react'
import { ArrowLeft } from 'react-feather'
import { Link, useLocation } from 'react-router-dom'
import { Box } from 'rebass'
import { useAppDispatch } from 'state/hooks'
import { resetMintState } from 'state/mint/actions'
import { resetMintState as resetMintV3State } from 'state/mint/v3/actions'
import styled, { useTheme } from 'styled-components'
import { ThemedText } from 'theme/components'
import { flexRowNoWrap } from 'theme/styles'

import { RowBetween } from '../Row'

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

const FindPoolTabsText = styled(ThemedText.SubHeaderLarge)`
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
          <Trans>Import V2 pool</Trans>
        </FindPoolTabsText>
      </RowBetween>
    </Tabs>
  )
}

const AddRemoveTitleText = styled(ThemedText.SubHeaderLarge)`
  flex: 1;
  margin: auto;
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
  const { chainId } = useWeb3React()
  const theme = useTheme()
  // reset states on back
  const dispatch = useAppDispatch()
  const location = useLocation()

  // detect if back should redirect to v3 or v2 pool page
  const poolLink = location.pathname.includes('add/v2')
    ? '/pools/v2'
    : '/pools' + (positionID ? `/${positionID.toString()}` : '')

  return (
    <Tabs>
      <RowBetween style={{ padding: '1rem 1rem 0 1rem' }} align="center">
        <StyledLink
          to={poolLink}
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
        <AddRemoveTitleText textAlign={children ? 'start' : 'center'}>
          {creating ? (
            <Trans>Create a pair</Trans>
          ) : adding ? (
            <Trans>Add liquidity</Trans>
          ) : (
            <Trans>Remove liquidity</Trans>
          )}
        </AddRemoveTitleText>
        {children && <Box style={{ marginRight: '.5rem' }}>{children}</Box>}
        <SettingsTab autoSlippage={autoSlippage} chainId={chainId} hideRoutingSettings />
      </RowBetween>
    </Tabs>
  )
}
