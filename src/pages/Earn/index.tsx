import { useContractKit } from '@celo-tools/use-contractkit'
import { ErrorBoundary } from '@sentry/react'
import { Token } from '@ubeswap/sdk'
import { ButtonPrimary } from 'components/Button'
import TokenSelect from 'components/CurrencyInputPanel/TokenSelect'
import ClaimAllRewardPanel from 'components/earn/ClaimAllRewardPanel'
import { ImportedPoolCard } from 'components/earn/ImportedPoolCard'
import ImportFarmModal from 'components/earn/ImportFarmModal'
import Loader from 'components/Loader'
import { isEqual } from 'lodash'
import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Text } from 'rebass'
import { useImportedFarmActionHandlers, useImportedFarmState } from 'state/importfarm/hooks'
import { useOwnerStakedPools } from 'state/stake/useOwnerStakedPools'
import styled from 'styled-components'

import { AutoColumn, ColumnCenter, TopSection } from '../../components/Column'
import { PoolCard } from '../../components/earn/PoolCard'
import { CardNoise, CardSection, DataCard } from '../../components/earn/styled'
import { RowBetween } from '../../components/Row'
import { IMPORTED_FARMS } from '../../constants'
import { ExternalLink, TYPE } from '../../theme'
import LiquidityWarning from '../Pool/LiquidityWarning'
import { FarmSummary, useFarmRegistry } from './useFarmRegistry'

const PageWrapper = styled.div`
  width: 100%;
  max-width: 640px;
`

const DataRow = styled(RowBetween)`
  ${({ theme }) => theme.mediaWidth.upToSmall`
flex-direction: column;
`};
`

const PoolWrapper = styled.div`
  margin-bottom: 12px;
`

const Header: React.FC = ({ children }) => {
  return (
    <DataRow style={{ alignItems: 'baseline', marginBottom: '12px' }}>
      <TYPE.mediumHeader style={{ marginTop: '0.5rem' }}>{children}</TYPE.mediumHeader>
    </DataRow>
  )
}

export const MobileContainer = styled.div`
  display: none;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    display: block;
  `}
`

export const DesktopContainer = styled.div`
  display: block;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    display: none;
  `}
`

export const StyledButton = styled.div`
  text-decoration: none;
  cursor: pointer;
  color: ${({ theme }) => theme.primary1};
  font-weight: 500;

  :hover {
    text-decoration: underline;
  }

  :focus {
    outline: none;
    text-decoration: underline;
  }

  :active {
    text-decoration: none;
  }
`

function useTokenFilter(): [Token | null, (t: Token | null) => void] {
  const [token, setToken] = useState<Token | null>(null)
  return [token, setToken]
}

export default function Earn() {
  const { t } = useTranslation()
  const { address: account } = useContractKit()

  const importedFarmsAddress = localStorage.getItem(IMPORTED_FARMS)
  const [prevImportedFarmAddress, setPrevImportedFarmAddress] = useState<string | null>(null)
  const [customFarms, setCustomFarms] = useState<string[]>([])
  const [filteringToken, setFilteringToken] = useTokenFilter()
  const [showImportFarmModal, setShowImportFarmModal] = useState<boolean>(false)
  const farmSummaries = useFarmRegistry()
  const { importedFarmSummaries } = useImportedFarmState()
  const { onAddImportedFarm, onRemoveImportedFarm } = useImportedFarmActionHandlers()
  useEffect(() => {
    if (!isEqual(importedFarmsAddress, prevImportedFarmAddress)) {
      setPrevImportedFarmAddress(importedFarmsAddress)
      setCustomFarms(importedFarmsAddress ? JSON.parse(importedFarmsAddress) : [])
    }
  }, [importedFarmsAddress, prevImportedFarmAddress])

  const filteredFarms = useMemo(() => {
    const importedSummaries: FarmSummary[] = importedFarmSummaries.filter(
      (summary) => summary !== undefined
    ) as unknown as FarmSummary[]
    if (filteringToken === null) {
      return [...farmSummaries, ...importedSummaries]
    } else {
      return [...farmSummaries, ...importedSummaries].filter(
        (farm) => farm?.token0Address === filteringToken?.address || farm?.token1Address === filteringToken?.address
      )
    }
  }, [filteringToken, farmSummaries, importedFarmSummaries])

  const { stakedFarms, featuredFarms, unstakedFarms, importedFarms } = useOwnerStakedPools(filteredFarms)

  const handleRemoveFarm = (farmAddress: string) => {
    if (customFarms) {
      localStorage.setItem(IMPORTED_FARMS, JSON.stringify(customFarms.filter((farm: string) => farm !== farmAddress)))
      onRemoveImportedFarm(farmAddress)
    }
  }

  const handleUpdateFarm = (farmSummary: FarmSummary) => {
    onAddImportedFarm(farmSummary)
  }

  return (
    <PageWrapper>
      <ClaimAllRewardPanel stakedFarms={stakedFarms} />
      <LiquidityWarning />
      {stakedFarms.length === 0 && (
        <TopSection gap="md">
          <DataCard>
            <CardNoise />
            <CardSection>
              <AutoColumn gap="md">
                <RowBetween>
                  <TYPE.white fontWeight={600}>Ubeswap {t('liquidityMining')}</TYPE.white>
                </RowBetween>
                <RowBetween>
                  <TYPE.white fontSize={14}>{t('liquidityMiningDesc')}</TYPE.white>
                </RowBetween>{' '}
                <ExternalLink
                  style={{ color: 'white', textDecoration: 'underline' }}
                  href="https://docs.ubeswap.org/faq"
                  target="_blank"
                >
                  <TYPE.white fontSize={14}>{t('liquidityMiningReadMore')}</TYPE.white>
                </ExternalLink>
              </AutoColumn>
            </CardSection>
            <CardNoise />
          </DataCard>
        </TopSection>
      )}
      <TopSection gap="md">
        <MobileContainer>
          {farmSummaries.length !== 0 && (
            <AutoColumn justify={'start'} gap="md">
              <Text
                textAlign="center"
                fontSize={16}
                style={{ padding: '.5rem 0 .5rem 0' }}
                onClick={() => {
                  setShowImportFarmModal(true)
                }}
              >
                <ButtonPrimary padding="8px 16px" borderRadius="8px" disabled={!account}>
                  {t('ImportFarm')}
                </ButtonPrimary>
              </Text>
            </AutoColumn>
          )}
        </MobileContainer>
        <RowBetween>
          <AutoColumn>
            <TokenSelect onTokenSelect={setFilteringToken} token={filteringToken} />
          </AutoColumn>
          <DesktopContainer>
            {farmSummaries.length !== 0 && (
              <AutoColumn justify={'end'} gap="md">
                <Text
                  textAlign="center"
                  fontSize={16}
                  style={{ padding: '.5rem 0 .5rem 0' }}
                  onClick={() => {
                    setShowImportFarmModal(true)
                  }}
                >
                  <ButtonPrimary padding="8px 16px" borderRadius="8px">
                    {'Import Farm'}
                  </ButtonPrimary>
                </Text>
              </AutoColumn>
            )}
          </DesktopContainer>
        </RowBetween>
      </TopSection>
      <ColumnCenter>
        {farmSummaries.length > 0 && filteredFarms.length == 0 && `No Farms for ${filteringToken?.symbol}`}
        {farmSummaries.length === 0 && <Loader size="48px" />}
      </ColumnCenter>
      {stakedFarms.length > 0 && (
        <>
          <Header>{t('yourPools')}</Header>
          {stakedFarms.map((farmSummary, index) => (
            <PoolWrapper key={index}>
              <ErrorBoundary>
                <PoolCard farmSummary={farmSummary} />
              </ErrorBoundary>
            </PoolWrapper>
          ))}
        </>
      )}
      {importedFarms.length > 0 && (
        <>
          <Header>{t('importedPools')}</Header>
          {importedFarms.map((farmSummary, index) => (
            <PoolWrapper key={index}>
              <ErrorBoundary>
                <PoolCard farmSummary={farmSummary} onRemoveImportedFarm={handleRemoveFarm} />
              </ErrorBoundary>
            </PoolWrapper>
          ))}
        </>
      )}
      {featuredFarms.length > 0 && (
        <>
          <Header>{t('featuredPools')}</Header>
          {featuredFarms.map((farmSummary) => (
            <PoolWrapper key={farmSummary.stakingAddress}>
              <ErrorBoundary>
                <PoolCard farmSummary={farmSummary} />
              </ErrorBoundary>
            </PoolWrapper>
          ))}
        </>
      )}
      {unstakedFarms.length > 0 && (
        <>
          <Header>{t('availablePools')}</Header>
          {unstakedFarms.map((farmSummary) => (
            <PoolWrapper key={farmSummary.stakingAddress}>
              <ErrorBoundary>
                <PoolCard farmSummary={farmSummary} />
              </ErrorBoundary>
            </PoolWrapper>
          ))}
        </>
      )}
      <ImportFarmModal
        farmSummaries={farmSummaries}
        isOpen={showImportFarmModal}
        onDismiss={() => setShowImportFarmModal(false)}
      />
      {customFarms.map((farmAddress, index) => (
        <ImportedPoolCard key={index} farmAddress={farmAddress} onUpdateFarm={(farm) => handleUpdateFarm(farm)} />
      ))}
    </PageWrapper>
  )
}
