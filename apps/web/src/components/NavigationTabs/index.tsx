import { Trans } from '@lingui/macro'
import { Percent } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import SettingsTab from 'components/Settings'
import { ReactNode } from 'react'
import { ArrowLeft } from 'react-feather'
import { Link, useNavigate } from 'react-router-dom'
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
          <Trans>Import V2 pool</Trans>
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
  children,
}: {
  adding: boolean
  creating: boolean
  autoSlippage: Percent
  showBackLink?: boolean
  children?: ReactNode
}) {
  const { chainId } = useWeb3React()
  const theme = useTheme()
  // reset states on back
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  return (
    <Tabs>
      <RowBetween style={{ padding: '1rem 1rem 0 1rem' }} align="center">
        <StyledLink
          to=".."
          onClick={(e) => {
            e.preventDefault()
            navigate(-1)

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
