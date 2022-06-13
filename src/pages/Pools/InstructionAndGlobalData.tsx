import React from 'react'
import styled from 'styled-components'
import { Trans } from '@lingui/macro'
import { ExternalLink } from 'theme'
import { formatBigLiquidity } from 'utils/formatBalance'
import Loader from 'components/Loader'
import { useGlobalData } from 'state/about/hooks'
import { useMedia } from 'react-use'
import useParsedQueryString from 'hooks/useParsedQueryString'

export const GlobalData = () => {
  const data = useGlobalData()

  const globalData = data && data.dmmFactories[0]
  const aggregatorData = data?.aggregatorData

  const above1000 = useMedia('(min-width: 1000px)')
  if (!above1000) return null

  return (
    <InstructionAndGlobalDataContainer columns={2}>
      <GlobalDataItem>
        <GlobalDataItemBaseLine>
          <GlobalDataItemTitle>
            <Trans>Total Trading Volume:</Trans>&nbsp;
          </GlobalDataItemTitle>
          <GlobalDataItemValue>
            {aggregatorData?.totalVolume ? formatBigLiquidity(aggregatorData.totalVolume, 2, true) : <Loader />}
          </GlobalDataItemValue>
        </GlobalDataItemBaseLine>
      </GlobalDataItem>
      <GlobalDataItem>
        <GlobalDataItemBaseLine>
          <GlobalDataItemTitle>
            <Trans>Total Value Locked:</Trans>&nbsp;
          </GlobalDataItemTitle>
          <GlobalDataItemValue>
            {globalData ? formatBigLiquidity(globalData.totalLiquidityUSD, 2, true) : <Loader />}
          </GlobalDataItemValue>
        </GlobalDataItemBaseLine>
      </GlobalDataItem>
    </InstructionAndGlobalDataContainer>
  )
}

export const Instruction = () => {
  const qs = useParsedQueryString()
  const tab = (qs.tab as string) || 'dmm'

  const below1412 = useMedia('(max-width: 1412px)')
  const above1000 = useMedia('(min-width: 1001px)')

  return (
    <InstructionItem>
      <InstructionText>
        {tab === 'promm' ? (
          <Trans>
            Add liquidity to our Elastic Pools & earn fees automatically. {below1412 && above1000 ? <br /> : ''}Provide
            liquidity in any price range & earn more with concentrated liquidity. Your fee earnings will also be
            compounded!
          </Trans>
        ) : (
          <Trans>
            Add liquidity to our Classic Pools & earn fees automatically. We amplify liquidity pools so you earn more
            fees even with less liquidity!
          </Trans>
        )}
        &nbsp;
      </InstructionText>
      <ExternalLink
        href={
          tab === 'promm'
            ? 'https://docs.kyberswap.com/guides/creating-a-pool'
            : 'https://docs.kyberswap.com/classic/guides/basic-pool-creation'
        }
        style={{ fontSize: '14px' }}
      >
        <Trans>Learn More ↗</Trans>
      </ExternalLink>
    </InstructionItem>
  )
}

const InstructionAndGlobalDataContainer = styled.div<{ columns?: number }>`
  display: grid;
  grid-gap: 24px;
  grid-template-columns: ${({ columns }) =>
    columns
      ? Array(columns)
          .fill('1fr')
          .join(' ')
      : '1fr 1fr 1fr'};

  ${({ theme }) => theme.mediaWidth.upToMedium`
    grid-template-columns: 1fr;
    grid-gap: 16px;
  `};
`

const GlobalDataItem = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px 50px;
  border-radius: 999px;
  background-color: ${({ theme }) => theme.background};
`

const GlobalDataItemBaseLine = styled.div`
  display: flex;
  align-items: baseline;
  margin-top: -2px;
`

const GlobalDataItemTitle = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.text7};
`

const GlobalDataItemValue = styled.span`
  font-size: 18px;
  font-weight: 500;
  color: ${({ theme }) => theme.primary};
`

const InstructionItem = styled.div`
  padding: 1rem;
  background: ${({ theme }) => theme.bg17};
  border-radius: 999px;
  text-align: center;
  grid-column: 1 / -1;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    border-radius: 8px;
    text-align: start;
    `}
`

const InstructionText = styled.span`
  font-size: 14px;
  color: ${({ theme }) => theme.text};
  line-height: 1.5;
`
