import React, { useState } from 'react'
import styled from 'styled-components'
import { Flex } from 'rebass'
import { useTranslation } from 'react-i18next'

import { ButtonOutlined } from 'components/Button'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import ExpandableSectionButton from 'components/ExpandableSectionButton'
import { Farm } from 'state/types'
import { formattedNum } from 'utils'
import { useFarmClaimModalToggle, useFarmStakeModalToggle } from 'state/application/hooks'
import InputGroup from './InputGroup'

const TableRow = styled.div<{ fade?: boolean; oddRow?: boolean }>`
  display: grid;
  grid-gap: 1em;
  grid-template-columns: 2fr 1fr 1fr 0.5fr 1fr 1fr 1fr 1.25fr 0.2fr;
  grid-template-areas: 'pools liq apy amp your_staked earnings claim stake dropdown';
  padding: 15px 36px 13px 26px;
  font-size: 12px;
  align-items: center;
  height: fit-content;
  position: relative;
  opacity: ${({ fade }) => (fade ? '0.6' : '1')};
  background-color: ${({ theme, oddRow }) => (oddRow ? theme.oddRow : theme.evenRow)};
  border: 1px solid transparent;

  &:hover {
    border: 1px solid #4a636f;
  }
`

const StyledItemCard = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-column-gap: 4px;
  border-radius: 10px;
  margin-bottom: 0;
  padding: 8px 20px 4px 20px;
  background-color: ${({ theme }) => theme.bg6};
  font-size: 12px;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    margin-bottom: 20px;
  `}
`

const DataText = styled(Flex)`
  color: ${({ theme }) => theme.text7};
  flex-direction: column;
`

interface ListItemProps {
  farm: Farm
  oddRow?: boolean
}

export const ItemCard = ({ farm }: ListItemProps) => {
  return (
    <div>
      <StyledItemCard>{farm.lpAddress}</StyledItemCard>
    </div>
  )
}

const ListItem = ({ farm, oddRow }: ListItemProps) => {
  const { t } = useTranslation()
  const [expand, setExpand] = useState<boolean>(false)
  const toggleFarmClaimModal = useFarmClaimModalToggle()
  const toggleFarmStakeModal = useFarmStakeModalToggle()

  const amp = farm.amp / 10000

  const handleClickClaim = () => {
    toggleFarmClaimModal()
  }

  const handleClickStake = () => {
    toggleFarmStakeModal()
  }

  // console.log('==farm', farm.token0)
  // amp: "10000"
  // createdAtTimestamp: "1617522591"
  // feeUSD: "0.006136305202809869895916192222526841"
  // id: "0x4f54c52d446605f324f30ddd79547d607255612e"
  // liquidityChangeUSD: 0
  // lpAddress: "0x4F54C52D446605f324f30dDd79547D607255612E"
  // oneDayFeeUSD: 0
  // oneDayFeeUntracked: 0
  // oneDayVolumeUSD: 0
  // oneDayVolumeUntracked: 0
  // oneWeekVolumeUSD: 0
  // quoteToken: Token {decimals: 18, symbol: "WETH", name: "Wrapped Ether", chainId: 3, address: "0xc778417E063141139Fce010982780140Aa0cD5Ab"}
  // reserve0: "86.771769009905401082"
  // reserve1: "0.078991397433965186"
  // reserveETH: "4.54804177232616629247234854644059"
  // reserveUSD: "7044.174081924136937811738913587944"
  // token: Token {decimals: 18, symbol: "KNC", name: "Kyber Network Crystal", chainId: 3, address: "0x7B2810576aa1cce68F2B118CeF1F36467c648F92"}
  // token0: {__typename: "Token", id: "0x7b2810576aa1cce68f2b118cef1f36467c648f92", symbol: "KNC", name: "Kyber Network Crystal", totalLiquidity: "1200.297279625281290017", …}
  // token0Price: "1098.496441747905641148895788339712"
  // token0PriceMax: "-1"
  // token0PriceMin: "0"
  // token1: {__typename: "Token", id: "0xc778417e063141139fce010982780140aa0cd5ab", symbol: "WETH", name: "Wrapped Ether", totalLiquidity: "42.444166675683990448", …}
  // token1Price: "0.0009103352200293156467345837875117623"
  // token1PriceMax: "-1"
  // token1PriceMin: "0"
  // totalSupply: "2.617925923461467932"
  // trackedReserveETH: "1.300244512721725914"
  // trackedReserveUSD: 1954.922228609498
  // txCount: "7"
  // untrackedFeeUSD: "0.01298603455462735056409388182345011"
  // untrackedVolumeUSD: "8.618903656601007799455118056568965"
  // vReserve0: "86.771769009905401082"
  // vReserve1: "0.078991397433965186"
  // volumeChangeUSD: 0
  // volumeChangeUntracked: 0
  // volumeUSD: "4.072161858978394291192468158213394"
  return (
    <>
      <TableRow oddRow={oddRow}>
        <DataText grid-area="pools">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <DoubleCurrencyLogo currency0={farm.token} currency1={farm.quoteToken} size={16} margin={true} />
            <span>
              {farm.token?.symbol} - {farm.quoteToken?.symbol}
            </span>
          </div>
        </DataText>
        <DataText grid-area="liq">{formattedNum(farm.reserveUSD, true)}</DataText>
        <DataText grid-area="apy">24.5%</DataText>
        <DataText grid-area="amp">{amp}</DataText>
        <DataText grid-area="your_staked">{farm.userData?.stakedBalance}</DataText>
        <DataText grid-area="earnings">{farm.userData?.earnings}</DataText>
        <DataText grid-area="claim">
          <ButtonOutlined padding="8px 16px" width="fit-content" onClick={handleClickClaim}>
            {t('claim')}
          </ButtonOutlined>
        </DataText>
        <DataText grid-area="stake">
          <ButtonOutlined padding="8px 16px" width="100%" onClick={handleClickStake}>
            {t('stakeUnstake')}
          </ButtonOutlined>
        </DataText>
        <DataText grid-area="dropdown">
          <ExpandableSectionButton expanded={expand} onClick={() => setExpand(!expand)} />
        </DataText>
      </TableRow>

      {expand && (
        <TableRow oddRow={oddRow}>
          <DataText grid-area="pools"></DataText>
          <DataText grid-area="liq"></DataText>
          <DataText grid-area="apy"></DataText>
          <DataText grid-area="amp">{amp}</DataText>
          <DataText grid-area="your_staked">{farm.userData?.stakedBalance}</DataText>
          <DataText grid-area="earnings">{farm.userData?.earnings}</DataText>
          <DataText grid-area="actions">
            <InputGroup
              pid={farm.id}
              pairAddress={farm.lpAddress}
              pairSymbol={'VT'}
              token0Address={farm.token0.id}
              token1Address={farm.token1.id}
            />
            asdas
          </DataText>

          {/* <DataText grid-area="claim">
            <ButtonOutlined padding="8px 16px" width="fit-content">
              {t('claim')}
            </ButtonOutlined>
          </DataText>
          <DataText grid-area="stake">
            <ButtonOutlined padding="8px 16px" width="100%">
              {t('stakeUnstake')}
            </ButtonOutlined>
          </DataText>
          <DataText grid-area="dropdown"></DataText> */}
        </TableRow>
      )}
    </>
  )
}

export default ListItem
