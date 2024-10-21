import { CurrencyAmount, Percent } from '@ubeswap/sdk-core'
import { Pool } from '@uniswap/v3-sdk'
import { useWeb3React } from '@web3-react/core'
import Badge from 'components/Badge'
import { ButtonGray, ButtonPrimary } from 'components/Button'
import { DarkCard, LightCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import { LoadingRows as BaseLoadingRows } from 'components/Loader/styled'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import { RowBetween, RowFixed } from 'components/Row'
import TransactionConfirmationModal, { ConfirmationModalContent } from 'components/TransactionConfirmationModal'
import { isSupportedChain } from 'constants/chains'
import { parseUnits } from 'ethers/lib/utils'
import { chainIdToBackendName, getPoolDetailsURL } from 'graphql/data/util'
import { useToken } from 'hooks/Tokens'
import { useIchiVaultDetails, useIchiVaults } from 'hooks/useV3Positions'
import { Trans } from 'i18n'
import { useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import styled from 'styled-components'
import { ClickableStyle, HideExtraSmall, ThemedText } from 'theme/components'
import { useMedia } from 'ui'
import { currencyId } from 'utils/currencyId'
import { useFormatter } from 'utils/formatNumbers'
import { unwrappedToken } from 'utils/unwrappedToken'

import { UserAmounts } from '@ichidao/ichi-vaults-sdk'
import { SmallButtonPrimary } from '../../components/Button/index'

export const LoadingRows = styled(BaseLoadingRows)`
  padding-top: 36px;
  min-width: 75%;
  max-width: 600px;
  grid-column-gap: 0.5em;
  grid-row-gap: 0.8em;
  grid-template-columns: repeat(3, 1fr);
  padding: 8px;

  & > div:nth-child(4n + 1) {
    grid-column: 1 / 3;
  }
  & > div:nth-child(4n) {
    grid-column: 3 / 4;
    margin-bottom: 2em;
  }
`

const VaultPageButtonPrimary = styled(ButtonPrimary)`
  width: 228px;
  height: 40px;
  font-size: 16px;
  line-height: 20px;
  border-radius: 12px;
`

const PageWrapper = styled.div`
  padding: 68px 16px 16px 16px;

  min-width: 500px;
  max-width: 800px;

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    min-width: 100%;
    padding: 16px;
  }

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    min-width: 100%;
    padding: 16px;
  }
`

const BadgeText = styled.div`
  font-weight: 535;
  font-size: 14px;
  color: ${({ theme }) => theme.neutral2};
`

// responsive text
// disable the warning because we don't use the end prop, we just want to filter it out
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const Label = styled(({ end, ...props }) => <ThemedText.DeprecatedLabel {...props} />)<{ end?: boolean }>`
  display: flex;
  font-size: 16px;
  justify-content: ${({ end }) => (end ? 'flex-end' : 'flex-start')};
  align-items: center;
`

const HoverText = styled(ThemedText.DeprecatedMain)`
  text-decoration: none;
  color: ${({ theme }) => theme.neutral2};
  :hover {
    color: ${({ theme }) => theme.neutral1};
    text-decoration: none;
  }
`

const ResponsiveRow = styled(RowBetween)`
  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    flex-direction: column;
    align-items: flex-start;
    row-gap: 16px;
    width: 100%;
  }
`

const ActionButtonResponsiveRow = styled(ResponsiveRow)`
  margin-top: 10px;
  width: 100%;
  justify-content: flex-end;
  gap: 10px;

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    width: 100%;
    flex-direction: row;
    * {
      width: 100%;
    }
  }
`

const StyledPoolLink = styled(Link)`
  text-decoration: none;
  ${ClickableStyle}
`

const PairHeader = styled(ThemedText.H1Medium)`
  margin-right: 10px;
`

export function VaultPageUnsupportedContent() {
  return (
    <PageWrapper>
      <div style={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
        <ThemedText.HeadlineLarge style={{ marginBottom: '8px' }}>
          <Trans>Single sided vault unavailable</Trans>
        </ThemedText.HeadlineLarge>
        <ThemedText.BodyPrimary style={{ marginBottom: '32px' }}>
          <Trans>Url can be a wrong. PLease check and try again</Trans>
        </ThemedText.BodyPrimary>
        <VaultPageButtonPrimary as={Link} to="/pool" width="fit-content">
          <Trans>Back to Pools</Trans>
        </VaultPageButtonPrimary>
      </div>
    </PageWrapper>
  )
}

export default function VaultPage() {
  const { chainId } = useWeb3React()
  if (isSupportedChain(chainId)) {
    return <VaultPageContent />
  } else {
    return <VaultPageUnsupportedContent />
  }
}

const PositionLabelRow = styled(RowFixed)({
  flexWrap: 'wrap',
  gap: 8,
})

function VaultPageContent() {
  const { vaultAddress } = useParams<{ vaultAddress?: string }>()
  const [searchParams] = useSearchParams()
  const fromFarm = searchParams.get('from_farm') === 'true'
  const { chainId, account } = useWeb3React()
  const media = useMedia()
  const { formatCurrencyAmount, formatDelta } = useFormatter()

  const { loading: userVaultsLoading, amounts: userVaults } = useIchiVaults(account)
  const { loading: vaultLoading, info: vaultDetails } = useIchiVaultDetails(vaultAddress)
  console.log({ vaultDetails })

  const token0 = useToken(
    vaultDetails ? (vaultDetails.allowTokenA ? vaultDetails.tokenA : vaultDetails.tokenB) : undefined
  )
  const token1 = useToken(
    vaultDetails ? (vaultDetails.allowTokenA ? vaultDetails.tokenB : vaultDetails.tokenA) : undefined
  )

  const currency0 = token0 ? unwrappedToken(token0) : undefined
  const currency1 = token1 ? unwrappedToken(token1) : undefined

  const feeAmount = vaultDetails ? parseInt(vaultDetails.fee || '100') : undefined
  const poolAddress = token0 && token1 && feeAmount ? Pool.getAddress(token0, token1, feeAmount) : undefined

  const userAmounts: { amount0: string; amount1: string } | undefined = useMemo(() => {
    if (userVaultsLoading || vaultLoading) {
      return
    }
    const userVault = userVaults
      ? userVaults.find((v) => v.vaultAddress.toLowerCase() == vaultAddress?.toLowerCase())
      : undefined
    if (userVault) {
      if (userVault.vaultInfo.allowTokenA) {
        return {
          amount0: userVault.userAmounts.amount0,
          amount1: userVault.userAmounts.amount1,
        }
      } else {
        return {
          amount0: userVault.userAmounts.amount1,
          amount1: userVault.userAmounts.amount0,
        }
      }
    } else {
      return {
        amount0: '0',
        amount1: '0',
      } as UserAmounts
    }
  }, [userVaultsLoading, vaultLoading, userVaults, vaultAddress])

  const currency0Amount =
    currency0 && userAmounts
      ? CurrencyAmount.fromRawAmount(currency0, parseUnits(userAmounts.amount0, currency0.decimals).toString())
      : undefined

  const currency1Amount =
    currency1 && userAmounts
      ? CurrencyAmount.fromRawAmount(currency1, parseUnits(userAmounts.amount1, currency1.decimals).toString())
      : undefined

  const [showConfirm, setShowConfirm] = useState(false)

  //const addTransaction = useTransactionAdder()

  if (!vaultDetails && !vaultLoading) {
    return <VaultPageUnsupportedContent />
  }

  return vaultLoading || userVaultsLoading ? (
    <LoadingRows>
      <div />
      <div />
      <div />
      <div />
      <div />
      <div />
      <div />
      <div />
      <div />
      <div />
      <div />
      <div />
    </LoadingRows>
  ) : (
    <PageWrapper>
      <TransactionConfirmationModal
        isOpen={showConfirm}
        onDismiss={() => setShowConfirm(false)}
        attemptingTxn={showConfirm}
        hash=""
        reviewContent={() => (
          <ConfirmationModalContent
            title={<Trans>Claim fees</Trans>}
            onDismiss={() => setShowConfirm(false)}
            topContent={() => <div></div>}
          />
        )}
        pendingText={<Trans>Collecting fees</Trans>}
      />
      <AutoColumn gap="md">
        <AutoColumn gap="sm">
          <Link
            data-cy="visit-pool"
            style={{ textDecoration: 'none', width: 'fit-content', marginBottom: '0.5rem' }}
            to={fromFarm ? '/farmv3/' + poolAddress?.toLowerCase() : '/pool'}
          >
            <HoverText>{fromFarm ? <Trans>← Back to Farm</Trans> : <Trans>← Back to Pool</Trans>}</HoverText>
          </Link>
          <ResponsiveRow>
            <PositionLabelRow>
              <DoubleCurrencyLogo currency0={currency0} currency1={currency1} size={24} margin={true} />
              <StyledPoolLink to={poolAddress ? getPoolDetailsURL(poolAddress, chainIdToBackendName(chainId)) : ''}>
                <PairHeader>
                  &nbsp;{currency0?.symbol}&nbsp;/&nbsp;{currency1?.symbol}
                </PairHeader>
              </StyledPoolLink>
              {feeAmount && (
                <Badge style={{ marginRight: '8px' }}>
                  <BadgeText>{formatDelta(parseFloat(new Percent(feeAmount, 1_000_000).toSignificant()))}</BadgeText>
                </Badge>
              )}
            </PositionLabelRow>
          </ResponsiveRow>
        </AutoColumn>
        <DarkCard>
          <AutoColumn gap="md">
            <RowBetween>
              <RowFixed>
                <Label display="flex" style={{ marginRight: '12px' }}>
                  <Trans>Single sided vault</Trans>
                </Label>
              </RowFixed>
              <HideExtraSmall>
                <ThemedText.SubHeaderSmall>
                  powered by{' '}
                  <img style={{ width: '50px', verticalAlign: 'middle' }} src="/images/logos/ichi_logo.svg" />
                </ThemedText.SubHeaderSmall>
              </HideExtraSmall>
            </RowBetween>

            <ResponsiveRow align="flex-start">
              <AutoColumn style={{ width: media.md ? '100%' : '40%' }}>
                {media.md ? (
                  <RowBetween>
                    <RowFixed>Deposit Token</RowFixed>
                    <RowFixed>
                      <CurrencyLogo currency={currency0} size="20px" style={{ marginRight: '0.5rem' }} />
                      <ThemedText.DeprecatedMain>{currency0?.symbol}</ThemedText.DeprecatedMain>
                    </RowFixed>
                  </RowBetween>
                ) : (
                  <AutoColumn>
                    <RowFixed>Deposit Token</RowFixed>
                    <RowFixed marginTop="16px">
                      <CurrencyLogo currency={currency0} size="20px" style={{ marginRight: '0.5rem' }} />
                      <ThemedText.DeprecatedMain>{currency0?.symbol}</ThemedText.DeprecatedMain>
                    </RowFixed>
                  </AutoColumn>
                )}
              </AutoColumn>
              <AutoColumn style={{ width: media.md ? '100%' : '60%' }}>
                <RowFixed>Your Value</RowFixed>
                <LightCard padding="12px 16px" marginTop="4px">
                  <AutoColumn gap="md">
                    <RowBetween>
                      <RowFixed>
                        <CurrencyLogo currency={currency0} size="20px" style={{ marginRight: '0.5rem' }} />
                        <ThemedText.DeprecatedMain>{currency0?.symbol}</ThemedText.DeprecatedMain>
                      </RowFixed>
                      <RowFixed>
                        <ThemedText.DeprecatedMain>
                          {currency0Amount ? formatCurrencyAmount({ amount: currency0Amount }) : '-'}
                        </ThemedText.DeprecatedMain>
                      </RowFixed>
                    </RowBetween>
                    <RowBetween>
                      <RowFixed>
                        <CurrencyLogo currency={currency1} size="20px" style={{ marginRight: '0.5rem' }} />
                        <ThemedText.DeprecatedMain>{currency1?.symbol}</ThemedText.DeprecatedMain>
                      </RowFixed>
                      <RowFixed>
                        <ThemedText.DeprecatedMain>
                          {currency1Amount ? formatCurrencyAmount({ amount: currency1Amount }) : '-'}
                        </ThemedText.DeprecatedMain>
                      </RowFixed>
                    </RowBetween>
                  </AutoColumn>
                </LightCard>
              </AutoColumn>
            </ResponsiveRow>
          </AutoColumn>
        </DarkCard>
      </AutoColumn>
      <ResponsiveRow>
        <ActionButtonResponsiveRow>
          {currency0 && currency1 ? (
            <SmallButtonPrimary
              as={Link}
              to={`/add/single/${currencyId(currency0)}/${currencyId(currency1)}`}
              padding="6px 8px"
              width="fit-content"
              $borderRadius="12px"
            >
              <Trans>Add liquidity</Trans>
            </SmallButtonPrimary>
          ) : null}
          {userAmounts && userAmounts.amount0 != '0' ? (
            <ButtonGray
              as={Link}
              to={`/remove/single/${vaultAddress}`}
              padding="6px 8px"
              width="fit-content"
              $borderRadius="12px"
              style={{ marginRight: '8px' }}
            >
              <Trans>Withdraw</Trans>
            </ButtonGray>
          ) : null}
        </ActionButtonResponsiveRow>
      </ResponsiveRow>
    </PageWrapper>
  )
}
