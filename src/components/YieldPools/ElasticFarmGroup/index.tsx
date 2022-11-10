import { ChainId, Currency, CurrencyAmount, Token } from '@kyberswap/ks-sdk-core'
import { computePoolAddress } from '@kyberswap/ks-sdk-elastic'
import { Trans, t } from '@lingui/macro'
import { rgba } from 'polished'
import { useState } from 'react'
import { ArrowDown, ArrowUp, Info } from 'react-feather'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import CurrencyLogo from 'components/CurrencyLogo'
import Divider from 'components/Divider'
import HoverDropdown from 'components/HoverDropdown'
import Withdraw from 'components/Icons/Withdraw'
import InfoHelper from 'components/InfoHelper'
import { MouseoverTooltip, MouseoverTooltipDesktopOnly } from 'components/Tooltip'
import { ZERO_ADDRESS } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { useProAmmNFTPositionManagerContract } from 'hooks/useContract'
import useParsedQueryString from 'hooks/useParsedQueryString'
import useTheme from 'hooks/useTheme'
import { Dots } from 'pages/Pool/styleds'
import { useWalletModalToggle } from 'state/application/hooks'
import { useElasticFarms, useFailedNFTs, useFarmAction } from 'state/farms/elastic/hooks'
import { FarmingPool, UserInfo } from 'state/farms/elastic/types'
import { useSingleCallResult } from 'state/multicall/hooks'
import { useTokenPrices } from 'state/tokenPrices/hooks'
import { useIsTransactionPending } from 'state/transactions/hooks'
import { ExternalLink } from 'theme'
import { formatDollarAmount } from 'utils/numbers'

import { ClickableText, ProMMFarmTableHeader } from '../styleds'
import Row from './Row'
import {
  BtnPrimary,
  ConnectWalletButton,
  DepositButton,
  ForceWithdrawButton,
  HarvestAllButton,
  WithdrawButton,
} from './buttons'

const FarmContent = styled.div`
  background: ${({ theme }) => theme.background};
  border-radius: 20px;
  overflow: hidden;
`

const FarmRow = styled.div`
  height: 68px;

  display: flex;
  justify-content: flex-end;
  align-items: center;
  background-color: ${({ theme }) => rgba(theme.buttonBlack, 0.4)};
  padding: 0 1rem;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    width: 100%;
    flex-direction: column;
    gap: 20px;
    align-items: flex-start;
  `}
`

type Props = {
  address: string
  onOpenModal: (
    modalType: 'forcedWithdraw' | 'harvest' | 'deposit' | 'withdraw' | 'stake' | 'unstake',
    pid?: number | string,
  ) => void
  pools: FarmingPool[]
  userInfo?: UserInfo
}

enum SORT_FIELD {
  PID = 'pid',
  STAKED_TVL = 'staked_tvl',
  APR = 'apr',
  END_TIME = 'end_time',
  MY_DEPOSIT = 'my_deposit',
  MY_REWARD = 'reward',
}

enum SORT_DIRECTION {
  ASC = 'asc',
  DESC = 'desc',
}

const ProMMFarmGroup: React.FC<Props> = ({ address, onOpenModal, pools, userInfo }) => {
  const theme = useTheme()
  const { account, chainId } = useActiveWeb3React()
  const above768 = useMedia('(min-width: 768px)')
  const above1000 = useMedia('(min-width: 1000px)')

  const [sortField, setSortField] = useState(SORT_FIELD.PID)
  const [sortDirection, setSortDirection] = useState(SORT_DIRECTION.DESC)

  const { poolFeeLast24h } = useElasticFarms()

  const tokenAddressList = pools
    .map(p => [p.token0.wrapped.address, p.token1.wrapped.address, ...p.rewardTokens.map(rw => rw.wrapped.address)])
    .flat()

  const tokenPrices = useTokenPrices([...new Set(tokenAddressList)])

  const depositedUsd =
    userInfo?.depositedPositions.reduce(
      (acc, cur) =>
        acc +
        Number(cur.amount0.toExact()) * (tokenPrices[cur.amount0.currency.wrapped.address] || 0) +
        Number(cur.amount1.toExact()) * (tokenPrices[cur.amount1.currency.wrapped.address] || 0),
      0,
    ) || 0

  const userDepositedTokenAmounts =
    userInfo?.depositedPositions.reduce<{
      [address: string]: CurrencyAmount<Token>
    }>((result, pos) => {
      const address0 = pos.amount0.currency.address
      const address1 = pos.amount1.currency.address

      if (!result[address0]) result[address0] = pos.amount0
      else result[address0] = result[address0].add(pos.amount0)

      if (!result[address1]) result[address1] = pos.amount1
      else result[address1] = result[address1].add(pos.amount1)

      return result
    }, {}) || {}

  const rewardPendings = Object.values(userInfo?.rewardPendings || {}).flat()
  const rewardUSD =
    rewardPendings.reduce(
      (acc, cur) => acc + Number(cur.toExact()) * (tokenPrices[cur.currency.wrapped.address] || 0),
      0,
    ) || 0

  const rewardAmounts =
    rewardPendings.reduce<{
      [address: string]: CurrencyAmount<Currency>
    }>((result, amount) => {
      const address = amount.currency.wrapped.address

      if (!result[address]) result[address] = amount
      else result[address] = result[address].add(amount)
      return result
    }, {}) || {}

  const sortedPools = pools
    .map(pool => {
      const tvl = pool.stakedTvl
        ? pool.stakedTvl
        : tokenPrices[pool.token0.wrapped.address] * Number(pool.tvlToken0.toExact()) +
          tokenPrices[pool.token1.wrapped.address] * Number(pool.tvlToken1.toExact())

      const totalRewardValue = pool.totalRewards.reduce(
        (total, rw) => total + Number(rw.toExact()) * tokenPrices[rw.currency.wrapped.address],
        0,
      )

      const farmDuration = (pool.endTime - pool.startTime) / 86400
      const farmAPR = pool.apr ? pool.apr : (365 * 100 * (totalRewardValue || 0)) / farmDuration / pool.poolTvl

      let poolAPR = pool.poolAPR || 0
      if (!poolAPR && pool.feesUSD && poolFeeLast24h[pool.poolAddress]) {
        const pool24hFee = pool.feesUSD - poolFeeLast24h[pool.poolAddress]
        poolAPR = (pool24hFee * 100 * 365) / pool.poolTvl
      }

      const joinedPositions = userInfo?.joinedPositions[pool.pid] || []
      const depositedPositions =
        userInfo?.depositedPositions.filter(pos => {
          return (
            pool.poolAddress.toLowerCase() ===
            computePoolAddress({
              factoryAddress: NETWORKS_INFO[chainId || ChainId.MAINNET].elastic.coreFactory,
              tokenA: pos.pool.token0,
              tokenB: pos.pool.token1,
              fee: pos.pool.fee,
              initCodeHashManualOverride: NETWORKS_INFO[chainId || ChainId.MAINNET].elastic.initCodeHash,
            }).toLowerCase()
          )
        }) || []

      const depositedUsd = depositedPositions.reduce(
        (usd, pos) =>
          usd +
          Number(pos.amount1.toExact()) * (tokenPrices[pos.pool.token1.address.toLowerCase()] || 0) +
          Number(pos.amount0.toExact()) * (tokenPrices[pos.pool.token0.address.toLowerCase()] || 0),
        0,
      )

      const stakedUsd = joinedPositions.reduce(
        (usd, pos) =>
          usd +
          Number(pos.amount1.toExact()) * (tokenPrices[pos.pool.token1.address.toLowerCase()] || 0) +
          Number(pos.amount0.toExact()) * (tokenPrices[pos.pool.token0.address.toLowerCase()] || 0),
        0,
      )

      const rewardPendings =
        userInfo?.rewardPendings[pool.pid] || pool.rewardTokens.map(token => CurrencyAmount.fromRawAmount(token, 0))

      const rewardUSD = rewardPendings.reduce(
        (acc, cur) => acc + +cur.toExact() * tokenPrices[cur.currency.wrapped.address],
        0,
      )

      return {
        tvl,
        poolAPR,
        farmAPR,
        depositedUsd,
        stakedUsd,
        rewardUSD,
        ...pool,
      }
    })
    .sort((a, b) => {
      switch (sortField) {
        case SORT_FIELD.PID:
          return sortDirection === SORT_DIRECTION.DESC ? +b.pid - +a.pid : +a.pid - +b.pid
        case SORT_FIELD.STAKED_TVL:
          return sortDirection === SORT_DIRECTION.DESC ? b.tvl - a.tvl : a.tvl - b.tvl
        case SORT_FIELD.APR:
          return sortDirection === SORT_DIRECTION.DESC
            ? b.farmAPR + b.poolAPR - a.farmAPR - a.poolAPR
            : a.farmAPR + a.poolAPR - b.farmAPR - b.poolAPR
        case SORT_FIELD.END_TIME:
          return sortDirection === SORT_DIRECTION.DESC ? b.endTime - a.endTime : a.endTime - b.endTime
        case SORT_FIELD.MY_DEPOSIT:
          return sortDirection === SORT_DIRECTION.DESC
            ? b.depositedUsd - a.depositedUsd
            : a.depositedUsd - b.depositedUsd
        case SORT_FIELD.MY_REWARD:
          return sortDirection === SORT_DIRECTION.DESC ? b.rewardUSD - a.rewardUSD : a.rewardUSD - b.rewardUSD
        default:
          return sortDirection === SORT_DIRECTION.DESC ? +b.pid - +a.pid : +a.pid - +b.pid
      }
    })

  const failedNFTs = useFailedNFTs()
  const userNFTs: string[] = userInfo?.depositedPositions.map(pos => pos.nftId.toString()) || []
  const hasAffectedByFarmIssue = userNFTs.some(id => failedNFTs.includes(id))

  const toggleWalletModal = useWalletModalToggle()
  const posManager = useProAmmNFTPositionManagerContract()

  const res = useSingleCallResult(posManager, 'isApprovedForAll', [account || ZERO_ADDRESS, address])
  const isApprovedForAll = res?.result?.[0]

  const { approve } = useFarmAction(address)
  const [approvalTx, setApprovalTx] = useState('')

  const isApprovalTxPending = useIsTransactionPending(approvalTx)

  const handleApprove = async () => {
    if (!isApprovedForAll) {
      const tx = await approve()
      setApprovalTx(tx)
    }
  }

  const qs = useParsedQueryString()
  const tab = qs.type || 'active'

  if (!pools) return null

  const canHarvest = Object.values(userInfo?.rewardPendings || {}).some(rw => rw.some(item => item.greaterThan('0')))
  const canWithdraw = !!userInfo?.depositedPositions.length

  const renderApproveButton = () => {
    if (isApprovedForAll || tab === 'ended') {
      return null
    }

    if (approvalTx && isApprovalTxPending) {
      return (
        <ButtonPrimary
          style={{
            whiteSpace: 'nowrap',
            height: '38px',
            padding: '0 12px',
          }}
          onClick={handleApprove}
          disabled
        >
          <Info width="16px" />
          <Text fontSize="14px" marginLeft="8px">
            <Dots>
              <Trans>Approving</Trans>
            </Dots>
          </Text>
        </ButtonPrimary>
      )
    }

    return (
      <MouseoverTooltipDesktopOnly
        text={
          <Text color={theme.subText} as="span">
            <Trans>
              Authorize the farming contract so it can access your liquidity positions (i.e. your NFT tokens). Then
              deposit your liquidity positions using the{' '}
              <Text as="span" color={theme.text}>
                Deposit
              </Text>{' '}
              button
            </Trans>
          </Text>
        }
        width="400px"
        placement="top"
      >
        <ButtonPrimary
          style={{
            whiteSpace: 'nowrap',
            height: '38px',
            padding: '0 12px',
          }}
          onClick={handleApprove}
        >
          <Info width="16px" />
          <Text fontSize="14px" marginLeft="8px">
            {approvalTx && isApprovalTxPending ? (
              <Dots>
                <Trans>Approving</Trans>
              </Dots>
            ) : (
              <Trans>Approve Farming Contract</Trans>
            )}
          </Text>
        </ButtonPrimary>
      </MouseoverTooltipDesktopOnly>
    )
  }

  const renderTopButtonsOnDesktop = () => {
    if (!isApprovedForAll && res?.loading) {
      return <Dots />
    }

    return (
      <Flex sx={{ gap: '12px' }} alignItems="center">
        {!account ? <ConnectWalletButton onClick={toggleWalletModal} /> : renderApproveButton()}
        <DepositButton
          disabled={!account || !isApprovedForAll || tab === 'ended'}
          onClick={() => onOpenModal('deposit')}
        />
        <WithdrawButton
          disabled={!account || !canWithdraw || !isApprovedForAll}
          onClick={() => onOpenModal('withdraw')}
        />

        {!!hasAffectedByFarmIssue && <ForceWithdrawButton onClick={() => onOpenModal('forcedWithdraw')} />}
      </Flex>
    )
  }

  const renderFarmGroupHeaderOnDesktop = () => {
    return (
      <Flex
        sx={{
          alignItems: 'center',
          padding: '0 1rem',
          justifyContent: 'space-between',
          height: '72px',
        }}
      >
        <Text
          sx={{
            fontWeight: 500,
            fontSize: '16px',
            lineHeight: '20px',
            color: theme.subText,
          }}
        >
          <Trans>Farming Contract</Trans>
        </Text>
        <Flex
          sx={{
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <Flex
            alignItems="center"
            sx={{
              gap: '12px',
            }}
          >
            <Text fontSize="12px" color={theme.subText}>
              <Trans>Deposited Liquidity</Trans>
              <InfoHelper
                text={t`Total value of liquidity positions (i.e. NFT tokens) you've deposited into the farming contract`}
                placement="top"
              />
            </Text>

            <HoverDropdown
              style={{ padding: '8px 0' }}
              content={
                account ? (
                  <Text
                    as="span"
                    sx={{
                      fontSize: '16px',
                      fontWeight: 500,
                    }}
                  >
                    {formatDollarAmount(depositedUsd)}
                  </Text>
                ) : (
                  '--'
                )
              }
              hideIcon={!account}
              dropdownContent={
                Object.values(userDepositedTokenAmounts).some(amount => amount.greaterThan(0)) ? (
                  <AutoColumn gap="sm">
                    {Object.values(userDepositedTokenAmounts).map(
                      amount =>
                        amount.greaterThan(0) && (
                          <Flex alignItems="center" key={amount.currency.address}>
                            <CurrencyLogo currency={amount.currency} size="16px" />
                            <Text fontSize="12px" marginLeft="4px">
                              {amount.toSignificant(8)}
                            </Text>
                          </Flex>
                        ),
                    )}
                  </AutoColumn>
                ) : (
                  ''
                )
              }
            />
          </Flex>
          {renderTopButtonsOnDesktop()}
        </Flex>
      </Flex>
    )
  }

  const renderFarmGroupHeaderOnMobile = () => {
    const renderDepositedLiquidity = () => {
      return (
        <Flex
          flexDirection="column"
          justifyContent={'center'}
          sx={{
            gap: '4px',
          }}
        >
          <Text fontSize="12px" color={theme.subText}>
            <Trans>Deposited Liquidity</Trans>
          </Text>

          <HoverDropdown
            style={{
              padding: '0',
            }}
            content={
              account ? (
                <Text
                  as="span"
                  sx={{
                    fontSize: '16px',
                    fontWeight: 500,
                  }}
                >
                  {formatDollarAmount(depositedUsd)}
                </Text>
              ) : (
                '--'
              )
            }
            hideIcon={!account}
            dropdownContent={
              Object.values(userDepositedTokenAmounts).some(amount => amount.greaterThan(0)) ? (
                <AutoColumn gap="sm">
                  {Object.values(userDepositedTokenAmounts).map(
                    amount =>
                      amount.greaterThan(0) && (
                        <Flex alignItems="center" key={amount.currency.address}>
                          <CurrencyLogo currency={amount.currency} size="16px" />
                          <Text fontSize="12px" marginLeft="4px">
                            {amount.toSignificant(8)}
                          </Text>
                        </Flex>
                      ),
                  )}
                </AutoColumn>
              ) : (
                ''
              )
            }
          />
        </Flex>
      )
    }

    const renderLeftGroup = () => {
      if (!account) {
        return <ConnectWalletButton onClick={toggleWalletModal} />
      }

      if (!isApprovedForAll) {
        if (res?.loading) {
          return <Dots />
        }

        return (
          <ButtonPrimary
            style={{
              whiteSpace: 'nowrap',
              height: '38px',
              padding: '0 12px',
            }}
            onClick={handleApprove}
          >
            <MouseoverTooltip
              text={
                <Text color={theme.subText} as="span">
                  <Trans>
                    Authorize the farming contract so it can access your liquidity positions (i.e. your NFT tokens).
                    Then deposit your liquidity positions using the{' '}
                    <Text as="span" color={theme.text}>
                      Deposit
                    </Text>{' '}
                    button
                  </Trans>
                </Text>
              }
              placement="top"
            >
              <Flex width="24px" height="24px" justifyContent="center" alignItems="center">
                <Info
                  width="16px"
                  height="16px"
                  onClick={e => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                />
              </Flex>
            </MouseoverTooltip>

            <Text fontSize="14px">
              {approvalTx && isApprovalTxPending ? (
                <Dots>
                  <Trans>Approving</Trans>
                </Dots>
              ) : (
                <Trans>Approve</Trans>
              )}
            </Text>
          </ButtonPrimary>
        )
      }

      return renderDepositedLiquidity()
    }

    return (
      <Flex
        sx={{
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '72px',
          gap: '8px',
        }}
      >
        <Flex
          sx={{
            alignItems: 'center',
            height: '100%',
            flex: '1 1',
          }}
        >
          {renderLeftGroup()}
        </Flex>
        <DepositButton
          disabled={!account || !isApprovedForAll || tab === 'ended'}
          onClick={() => onOpenModal('deposit')}
          style={{
            flex: '0 0 44px',
          }}
        />
        <WithdrawButton
          disabled={!account || !canWithdraw || !isApprovedForAll}
          onClick={() => onOpenModal('withdraw')}
          style={{
            flex: '0 0 44px',
          }}
        />
      </Flex>
    )
  }

  const handleSortClick = (field: SORT_FIELD) => {
    setSortField(field)
    setSortDirection(prev =>
      sortField !== field
        ? SORT_DIRECTION.DESC
        : prev === SORT_DIRECTION.DESC
        ? SORT_DIRECTION.ASC
        : SORT_DIRECTION.DESC,
    )
  }

  const renderTableHeaderOnDesktop = () => {
    return (
      <ProMMFarmTableHeader>
        <Flex grid-area="token_pairs" alignItems="center" justifyContent="flex-start">
          <ClickableText onClick={() => handleSortClick(SORT_FIELD.PID)}>
            <Trans>Pool</Trans>
            {sortField === SORT_FIELD.PID &&
              (sortDirection === SORT_DIRECTION.DESC ? (
                <ArrowDown size={12} />
              ) : sortDirection === SORT_DIRECTION.ASC ? (
                <ArrowUp size={12} />
              ) : null)}
          </ClickableText>
        </Flex>

        <Flex grid-area="liq" alignItems="center" justifyContent="flex-start">
          <ClickableText
            onClick={() => {
              handleSortClick(SORT_FIELD.STAKED_TVL)
            }}
          >
            <Trans>Staked TVL</Trans>
            {sortField === SORT_FIELD.STAKED_TVL &&
              (sortDirection === SORT_DIRECTION.DESC ? (
                <ArrowDown size={12} />
              ) : sortDirection === SORT_DIRECTION.ASC ? (
                <ArrowUp size={12} />
              ) : null)}
          </ClickableText>
        </Flex>

        <Flex grid-area="apy" alignItems="center" justifyContent="flex-start">
          <ClickableText onClick={() => handleSortClick(SORT_FIELD.APR)}>
            <Trans>AVG APR</Trans>

            {sortField === SORT_FIELD.APR &&
              (sortDirection === SORT_DIRECTION.DESC ? (
                <ArrowDown size={12} />
              ) : sortDirection === SORT_DIRECTION.ASC ? (
                <ArrowUp size={12} />
              ) : null)}
          </ClickableText>
          <InfoHelper
            text={t`Average estimated return based on yearly fees of the pool and if it's still active, plus bonus rewards of the pool`}
          />
        </Flex>

        <Flex grid-area="end" alignItems="center" justifyContent="flex-start">
          <ClickableText onClick={() => handleSortClick(SORT_FIELD.END_TIME)}>
            <Trans>Ending In</Trans>
            {sortField === SORT_FIELD.END_TIME &&
              (sortDirection === SORT_DIRECTION.DESC ? (
                <ArrowDown size={12} />
              ) : sortDirection === SORT_DIRECTION.ASC ? (
                <ArrowUp size={12} />
              ) : null)}
          </ClickableText>
          <InfoHelper text={t`Once a farm has ended, you will continue to receive returns through LP Fees`} />
        </Flex>

        <Flex grid-area="staked_balance" alignItems="center" justifyContent="flex-start">
          <HoverDropdown
            padding="8px 0"
            hideIcon
            content={
              <ClickableText onClick={() => handleSortClick(SORT_FIELD.MY_DEPOSIT)}>
                <Flex flex={1}>My Deposit | Target Volume</Flex>{' '}
                {sortField === SORT_FIELD.MY_DEPOSIT &&
                  (sortDirection === SORT_DIRECTION.DESC ? (
                    <ArrowDown size={12} />
                  ) : sortDirection === SORT_DIRECTION.ASC ? (
                    <ArrowUp size={12} />
                  ) : null)}
                <Info size={12} style={{ marginLeft: '4px' }} />
              </ClickableText>
            }
            dropdownContent={
              <Text color={theme.subText} fontSize="12px" maxWidth="400px" lineHeight={1.5}>
                <Trans>
                  Some farms have a target trading volume (represented by the progress bar) to determine the amount of
                  reward you will earn. The more trading volume your liquidity positions support, the more rewards per
                  second you will make.
                  <br />
                  <br />
                  Once you have fully unlocked the target volume, you will start earning the maximum rewards per second.
                  Adjusting the staked amount will recalculate the target volume.
                  <br />
                  Learn more{' '}
                  <ExternalLink href="https://docs.kyberswap.com/guides/farming-mechanisms">here.</ExternalLink>
                </Trans>
              </Text>
            }
          />
        </Flex>

        <Flex grid-area="reward" alignItems="center" justifyContent="flex-end">
          <ClickableText onClick={() => handleSortClick(SORT_FIELD.MY_REWARD)}>
            <Trans>My Rewards</Trans>
            {sortField === SORT_FIELD.MY_REWARD &&
              (sortDirection === SORT_DIRECTION.DESC ? (
                <ArrowDown size={12} />
              ) : sortDirection === SORT_DIRECTION.ASC ? (
                <ArrowUp size={12} />
              ) : null)}
          </ClickableText>
        </Flex>

        <Flex grid-area="action" alignItems="center" justifyContent="flex-end">
          <ClickableText>
            <Trans>Actions</Trans>
          </ClickableText>
        </Flex>
      </ProMMFarmTableHeader>
    )
  }

  const renderRewardRowOnDesktop = () => {
    return (
      <FarmRow>
        <Flex
          alignItems="center"
          sx={{ gap: '24px' }}
          justifyContent={above768 ? 'flex-end' : 'space-between'}
          width={above768 ? undefined : '100%'}
        >
          <Flex
            alignItems="center"
            sx={{
              gap: '8px',
            }}
          >
            <Text fontSize="12px" color={theme.subText}>
              <Trans>Total Rewards</Trans>
            </Text>

            <HoverDropdown
              style={{ padding: '8px 0' }}
              content={
                account ? (
                  <Text
                    as="span"
                    sx={{
                      fontSize: '16px',
                      fontWeight: 500,
                    }}
                  >
                    {formatDollarAmount(rewardUSD)}
                  </Text>
                ) : (
                  '--'
                )
              }
              hideIcon={!account}
              dropdownContent={
                Object.values(rewardAmounts).length ? (
                  <AutoColumn gap="sm">
                    {Object.values(rewardAmounts).map(
                      amount =>
                        amount.greaterThan(0) && (
                          <Flex alignItems="center" key={amount.currency.wrapped.address}>
                            <CurrencyLogo currency={amount.currency} size="16px" />
                            <Text fontSize="12px" marginLeft="4px">
                              {amount.toSignificant(8)}
                            </Text>
                          </Flex>
                        ),
                    )}
                  </AutoColumn>
                ) : (
                  ''
                )
              }
            />
          </Flex>

          <HarvestAllButton onClick={() => onOpenModal('harvest')} disabled={!account || !canHarvest} />
        </Flex>

        {hasAffectedByFarmIssue && !above768 && (
          <BtnPrimary
            style={{ color: theme.red, border: `1px solid ${theme.red}`, background: theme.red + '33' }}
            padding={'12px'}
            onClick={() => onOpenModal('forcedWithdraw')}
          >
            <Withdraw width={20} height={20} />
            <Text fontSize="14px" marginLeft="4px">
              <Trans>Force Withdraw</Trans>
            </Text>
          </BtnPrimary>
        )}
      </FarmRow>
    )
  }

  const renderRewardRowOnMobile = () => {
    return (
      <Flex
        sx={{
          height: '68px',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Flex
          flexDirection="column"
          justifyContent={'center'}
          sx={{
            gap: '4px',
          }}
        >
          <Text fontSize="12px" color={theme.subText}>
            <Trans>Total Rewards</Trans>
          </Text>

          <HoverDropdown
            style={{ padding: '0' }}
            content={
              account ? (
                <Text
                  as="span"
                  sx={{
                    fontSize: '16px',
                    fontWeight: 500,
                  }}
                >
                  {formatDollarAmount(rewardUSD)}
                </Text>
              ) : (
                '--'
              )
            }
            hideIcon={!account}
            dropdownContent={
              Object.values(rewardAmounts).length ? (
                <AutoColumn gap="sm">
                  {Object.values(rewardAmounts).map(
                    amount =>
                      amount.greaterThan(0) && (
                        <Flex alignItems="center" key={amount.currency.wrapped.address}>
                          <CurrencyLogo currency={amount.currency} size="16px" />
                          <Text fontSize="12px" marginLeft="4px">
                            {amount.toSignificant(8)}
                          </Text>
                        </Flex>
                      ),
                  )}
                </AutoColumn>
              ) : (
                ''
              )
            }
          />
        </Flex>

        <HarvestAllButton onClick={() => onOpenModal('harvest')} disabled={!account || !canHarvest} />
      </Flex>
    )
  }

  return (
    <FarmContent data-testid="farm-block">
      {above1000 ? (
        <>
          {renderFarmGroupHeaderOnDesktop()}
          {renderTableHeaderOnDesktop()}
          {renderRewardRowOnDesktop()}
        </>
      ) : (
        <Flex flexDirection="column" padding="0 1rem" sx={{ backgroundColor: rgba(theme.buttonBlack, 0.4) }}>
          {renderFarmGroupHeaderOnMobile()}
          <Divider />
          {renderRewardRowOnMobile()}
          {!!hasAffectedByFarmIssue && (
            <ForceWithdrawButton
              style={{ width: '100%', marginBottom: '1rem' }}
              onClick={() => onOpenModal('forcedWithdraw')}
            />
          )}
        </Flex>
      )}

      <Divider />

      {sortedPools.map(pool => {
        return (
          <Row
            isUserAffectedByFarmIssue={hasAffectedByFarmIssue}
            isApprovedForAll={isApprovedForAll}
            pool={pool}
            key={pool.id}
            onOpenModal={onOpenModal}
            fairlaunchAddress={address}
            onHarvest={() => {
              onOpenModal('harvest', Number(pool.pid))
            }}
          />
        )
      })}
    </FarmContent>
  )
}

export default ProMMFarmGroup
