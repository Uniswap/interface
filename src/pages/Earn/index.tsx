import { useContractKit } from '@celo-tools/use-contractkit'
import { formatEther } from '@ethersproject/units'
import { faArrowDownWideShort } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
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
import { RowBetween, RowStart } from '../../components/Row'
import { IMPORTED_FARMS } from '../../constants'
import { ExternalLink, TYPE } from '../../theme'
import LiquidityWarning from '../Pool/LiquidityWarning'
import { FarmSummary, useFarmRegistry } from './useFarmRegistry'

enum FarmSort {
  UNKNOWN,
  DEPOSIT,
  YIELD,
}

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

const FancyButton = styled.button`
  color: ${({ theme }) => theme.text1};
  align-items: center;
  height: 2.2rem;
  padding: 0 0.7rem;
  border-radius: 12px;
  font-size: 1rem;
  width: auto;
  min-width: 3.5rem;
  border: 1px solid ${({ theme }) => theme.bg3};
  outline: none;
  background: ${({ theme }) => theme.bg1};
  :hover {
    border: 1px solid ${({ theme }) => theme.bg4};
  }
  :focus {
    border: 1px solid ${({ theme }) => theme.primary1};
  }
`

const Option = styled(FancyButton)<{ active: boolean }>`
  margin-right: 8px;
  :hover {
    cursor: pointer;
  }
  background-color: ${({ active, theme }) => active && theme.primary1};
  color: ${({ active, theme }) => (active ? theme.white : theme.text1)};
  font-weight: 500;
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

const ClaimAllRewardPanelComponent = React.memo(ClaimAllRewardPanel)
const ImportedPoolCardComponent = React.memo(ImportedPoolCard)
const ImportFarmModalComponent = React.memo(ImportFarmModal)
const PoolCardComponent = React.memo(PoolCard)

interface PoolCardProps {
  poolLabel: string
  farmSummaries: FarmSummary[]
  handleRemoveFarm?: (farmAddress: string) => void
}

const PoolCards = ({ poolLabel, farmSummaries, handleRemoveFarm }: PoolCardProps) => {
  const { t } = useTranslation()
  return farmSummaries.length > 0 ? (
    <>
      <Header>{t(poolLabel)}</Header>
      {farmSummaries.map((farmSummary) => (
        <PoolWrapper key={farmSummary.stakingAddress}>
          <ErrorBoundary>
            <PoolCardComponent farmSummary={farmSummary} onRemoveImportedFarm={handleRemoveFarm} />
          </ErrorBoundary>
        </PoolWrapper>
      ))}
    </>
  ) : null
}

const PoolCardsComponent = React.memo(PoolCards)

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
  const [sortType, setSortType] = useState<FarmSort>(FarmSort.UNKNOWN)
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

    const allSummaries = [...farmSummaries, ...importedSummaries]
    const sortedSummaries =
      sortType === FarmSort.YIELD
        ? allSummaries.sort((a, b) => Number(b.apy) - Number(a.apy))
        : allSummaries.sort((a, b) => {
            return Number(a.tvlUSD && b.tvlUSD ? formatEther(b.tvlUSD.sub(a.tvlUSD)) : 0)
          })
    if (filteringToken === null) {
      return sortedSummaries
    } else {
      return sortedSummaries.filter(
        (farm) => farm?.token0Address === filteringToken?.address || farm?.token1Address === filteringToken?.address
      )
    }
  }, [importedFarmSummaries, farmSummaries, sortType, filteringToken])

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
      <ClaimAllRewardPanelComponent stakedFarms={stakedFarms} />
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
            <RowStart>
              <TokenSelect onTokenSelect={setFilteringToken} token={filteringToken} />
              <Option
                style={{ marginLeft: '8px', marginBottom: '10px' }}
                onClick={() => {
                  setSortType(sortType === FarmSort.DEPOSIT ? FarmSort.UNKNOWN : FarmSort.DEPOSIT)
                }}
                active={sortType === FarmSort.DEPOSIT}
              >
                <FontAwesomeIcon icon={faArrowDownWideShort} />
                &nbsp;{t('deposit')}
              </Option>
              <Option
                onClick={() => {
                  setSortType(sortType === FarmSort.YIELD ? FarmSort.UNKNOWN : FarmSort.YIELD)
                }}
                active={sortType === FarmSort.YIELD}
              >
                <FontAwesomeIcon icon={faArrowDownWideShort} />
                &nbsp;{t('yield')}
              </Option>
            </RowStart>
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
                    {t('ImportFarm')}
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
      <PoolCardsComponent farmSummaries={stakedFarms} poolLabel={'yourPools'} />
      <PoolCardsComponent
        farmSummaries={importedFarms}
        poolLabel={'importedPools'}
        handleRemoveFarm={handleRemoveFarm}
      />
      <PoolCardsComponent farmSummaries={featuredFarms} poolLabel={'featuredPools'} />
      <PoolCardsComponent farmSummaries={unstakedFarms} poolLabel={'availablePools'} />
      <ImportFarmModalComponent
        farmSummaries={farmSummaries}
        isOpen={showImportFarmModal}
        onDismiss={() => setShowImportFarmModal(false)}
      />
      {customFarms.map((farmAddress, index) => (
        <ImportedPoolCardComponent
          key={index}
          farmAddress={farmAddress}
          onUpdateFarm={(farm) => handleUpdateFarm(farm)}
        />
      ))}
    </PageWrapper>
  )
}
