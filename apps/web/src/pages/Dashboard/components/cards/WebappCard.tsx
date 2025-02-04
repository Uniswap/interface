import styled from 'styled-components'

import ValuePropCard from './ValuePropCard'

import { useDashboardData } from '../../use-dashboard-data'
import { EarnerTokenRow, GainerTokenRow, LaunchpadRow } from './TokenRows'

const Contents = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
  position: absolute;
  width: 100%;
  bottom: 0;
  padding: 16px;
  @media (max-width: 1024px) {
    padding: 12px;
  }
  @media (max-width: 396px) {
    padding: 16px;
  }
`

const CardTitle = styled.h2`
  font-family: Basel;
  font-size: 22px;
  font-weight: 500;
  color: ${({ theme }) => theme.neutral1};
  margin: 0;
  padding: 16px 16px 0;
  @media (max-width: 1024px) {
    padding: 16px 16px 0;
    font-size: 20px;
  }
  @media (max-width: 396px) {
    padding: 16px 16px 0;
    font-size: 20px;
  }
`

const LoadingSpinner = styled.div`
  width: 100%;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.neutral2};
`

type WebappCardProps = {
  isDarkMode?: boolean
  tagText?: string
  title?: string
  type: 'token' | 'earn' | 'launch'
}

// Ana renk
const primary = '#2ABDFF'

export function WebappCard(props: WebappCardProps) {
  // Dashboard verilerini ve loading durumunu çek
  const { data, isLoading } = useDashboardData()

  // Loading için render
  if (isLoading) {
    return (
      <ValuePropCard
        minHeight="450px"
        isDarkMode={props.isDarkMode}
        textColor={primary}
        backgroundColor={{ dark: 'rgba(255, 0, 234, 0.12)', light: 'rgba(0, 102, 255, 0.04)' }}
      >
        {props.title && <CardTitle>{props.title}</CardTitle>}
        <Contents>
          <LoadingSpinner>Loading...</LoadingSpinner>
        </Contents>
      </ValuePropCard>
    )
  }

  // Kart içeriğini belirleme
  const renderContent = () => {
    if (!data) return null

    if (props.type === 'token') {
      return data.topGainers.map((gainer) => (
        <GainerTokenRow
          key={gainer.tokenAddress}
          tokenAddress={gainer.tokenAddress}
          price={gainer.price}
          change24h={gainer.change24h}
        />
      ))
    }

    if (props.type === 'earn') {
      return data.topEarnPools.map((pool) => (
        <EarnerTokenRow
          key={pool.type === 'stake' ? pool.contractAddress : pool.poolAddress}
          poolData={{
            ...pool,
            type: pool.type as 'stake' | 'farm',
          }}
        />
      ))
    }

    if (props.type === 'launch') {
      return <LaunchpadRow />
    }

    return null
  }

  return (
    <ValuePropCard
      minHeight="450px"
      isDarkMode={props.isDarkMode}
      textColor={primary}
      backgroundColor={{ dark: 'rgba(255, 0, 234, 0.12)', light: 'rgba(0, 102, 255, 0.04)' }}
    >
      {props.title && <CardTitle>{props.title}</CardTitle>}
      <Contents>{renderContent()}</Contents>
    </ValuePropCard>
  )
}
