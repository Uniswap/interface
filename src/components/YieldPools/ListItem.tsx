import { BigNumber } from '@ethersproject/bignumber'
import { MaxUint256 } from '@ethersproject/constants'
import { ChainId, Fraction, Token, TokenAmount } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { ethers } from 'ethers'
import JSBI from 'jsbi'
import React, { useMemo, useState } from 'react'
import { Clock, Minus, Plus, X } from 'react-feather'
import { Link } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'

import { ButtonEmpty, ButtonLight, ButtonOutlined, ButtonPrimary } from 'components/Button'
import CopyHelper from 'components/Copy'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import CurrencyLogo from 'components/CurrencyLogo'
import Divider from 'components/Divider'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import Harvest from 'components/Icons/Harvest'
import InfoHelper from 'components/InfoHelper'
import Modal from 'components/Modal'
import { MouseoverTooltip } from 'components/Tooltip'
import { Dots } from 'components/swap/styleds'
import { useActiveWeb3React } from 'hooks'
import { useToken } from 'hooks/Tokens'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import useFairLaunch from 'hooks/useFairLaunch'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useParsedQueryString from 'hooks/useParsedQueryString'
import useStakedBalance from 'hooks/useStakedBalance'
import useTheme from 'hooks/useTheme'
import useTokenBalance from 'hooks/useTokenBalance'
import { useWalletModalToggle } from 'state/application/hooks'
import { setAttemptingTxn, setShowConfirm, setTxHash, setYieldPoolsError } from 'state/farms/actions'
import { Farm, Reward } from 'state/farms/types'
import { useAppDispatch } from 'state/hooks'
import { ExternalLink } from 'theme'
import { formattedNum, isAddressString, shortenAddress } from 'utils'
import { currencyIdFromAddress } from 'utils/currencyId'
import { getTradingFeeAPR, useFarmApr, useFarmRewards, useFarmRewardsUSD } from 'utils/dmm'
import { formatTokenBalance, getFullDisplayBalance } from 'utils/formatBalance'
import { getFormattedTimeFromSecond } from 'utils/formatTime'

import {
  DMM_ANALYTICS_URL,
  MAX_ALLOW_APY, // FARMING_POOLS_CHAIN_STAKING_LINK,
  OUTSIDE_FAIRLAUNCH_ADDRESSES,
  TOBE_EXTENDED_FARMING_POOLS,
} from '../../constants'
import { ModalContentWrapper } from './ProMMFarmModals/styled'
import { APY, ActionButton, DataText, GetLP, RewardBalanceWrapper, StyledItemCard, TableRow } from './styleds'

const fixedFormatting = (value: BigNumber, decimals: number) => {
  const fraction = new Fraction(value.toString(), JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(decimals)))

  if (fraction.equalTo(JSBI.BigInt(0))) {
    return '0'
  }

  return fraction.toFixed(18).replace(/\.?0+$/, '')
}

interface ListItemProps {
  farm: Farm
  oddRow?: boolean
}

const ListItem = ({ farm }: ListItemProps) => {
  const { account, chainId } = useActiveWeb3React()
  const toggleWalletModal = useWalletModalToggle()
  const currentTimestamp = Math.floor(Date.now() / 1000)

  const qs = useParsedQueryString()
  const tab = qs.tab || 'active'

  const breakpoint = useMedia('(min-width: 992px)')
  const dispatch = useAppDispatch()

  const currency0 = useToken(farm.token0?.id) as Token
  const currency1 = useToken(farm.token1?.id) as Token

  const poolAddressChecksum = isAddressString(farm.id)
  const { value: userTokenBalance, decimals: lpTokenDecimals } = useTokenBalance(poolAddressChecksum)

  const outsideFarm = OUTSIDE_FAIRLAUNCH_ADDRESSES[farm.fairLaunchAddress]

  const userStakedBalance = farm.userData?.stakedBalance
    ? BigNumber.from(farm.userData?.stakedBalance)
    : BigNumber.from(0)

  const farmRewards = useFarmRewards([farm])

  // Ratio in % of LP tokens that are staked in the MC, vs the total number in circulation
  const lpTokenRatio = new Fraction(
    farm.totalStake.toString(),
    JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(lpTokenDecimals)),
  ).divide(
    new Fraction(
      ethers.utils.parseUnits(farm.totalSupply, lpTokenDecimals).toString(),
      JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(lpTokenDecimals)),
    ),
  )

  // Ratio in % of user's LP tokens balance, vs the total number in circulation
  const lpUserLPBalanceRatio = new Fraction(
    userTokenBalance.toString(),
    JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(lpTokenDecimals)),
  ).divide(
    new Fraction(
      ethers.utils.parseUnits(farm.totalSupply, lpTokenDecimals).toString(),
      JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(lpTokenDecimals)),
    ),
  )

  const userToken0Balance = parseFloat(lpUserLPBalanceRatio.toSignificant(6)) * parseFloat(farm.reserve0)
  const userToken1Balance = parseFloat(lpUserLPBalanceRatio.toSignificant(6)) * parseFloat(farm.reserve1)

  // Ratio in % of LP tokens that user staked, vs the total number in circulation
  const lpUserStakedTokenRatio = new Fraction(
    userStakedBalance.toString(),
    JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(lpTokenDecimals)),
  ).divide(
    new Fraction(
      ethers.utils.parseUnits(farm.totalSupply, lpTokenDecimals).toString(),
      JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(lpTokenDecimals)),
    ),
  )

  const userStakedToken0Balance = parseFloat(lpUserStakedTokenRatio.toSignificant(6)) * parseFloat(farm.reserve0)
  const userStakedToken1Balance = parseFloat(lpUserStakedTokenRatio.toSignificant(6)) * parseFloat(farm.reserve1)

  const userLPBalanceUSD = parseFloat(lpUserLPBalanceRatio.toSignificant(6)) * parseFloat(farm.reserveUSD)
  const userStakedBalanceUSD = parseFloat(lpUserStakedTokenRatio.toSignificant(6)) * parseFloat(farm.reserveUSD)

  const liquidity = parseFloat(lpTokenRatio.toSignificant(6)) * parseFloat(farm.reserveUSD)

  const farmAPR = useFarmApr(farm, liquidity.toString())

  const tradingFee = farm?.oneDayFeeUSD ? farm?.oneDayFeeUSD : farm?.oneDayFeeUntracked

  const tradingFeeAPR = getTradingFeeAPR(farm?.reserveUSD, tradingFee)

  let apr = farmAPR
  if (tradingFeeAPR < MAX_ALLOW_APY) apr += tradingFeeAPR

  const amp = farm.amp / 10000

  const pairSymbol = `${farm.token0.symbol}-${farm.token1.symbol} LP`
  const [depositValue, setDepositValue] = useState('')
  const [withdrawValue, setWithdrawValue] = useState('')
  const pairAddressChecksum = isAddressString(farm.id)
  const balance = useTokenBalance(pairAddressChecksum)
  const staked = useStakedBalance(farm.fairLaunchAddress, farm.pid)
  const rewardUSD = useFarmRewardsUSD(farmRewards)
  const { mixpanelHandler } = useMixpanel()

  const amountToApprove = useMemo(
    () =>
      TokenAmount.fromRawAmount(
        new Token(chainId || 1, pairAddressChecksum, balance.decimals, pairSymbol, ''),
        MaxUint256.toString(),
      ),
    [balance.decimals, chainId, pairAddressChecksum, pairSymbol],
  )
  const [approvalState, approve] = useApproveCallback(amountToApprove, !!chainId ? farm.fairLaunchAddress : undefined)

  let isStakeInvalidAmount

  try {
    isStakeInvalidAmount =
      depositValue === '' ||
      parseFloat(depositValue) === 0 ||
      ethers.utils.parseUnits(depositValue || '0', balance.decimals).gt(balance.value) // This causes error if number of decimals > 18
  } catch (err) {
    isStakeInvalidAmount = true
  }

  const isStakeDisabled = isStakeInvalidAmount

  let isUnstakeInvalidAmount

  try {
    isUnstakeInvalidAmount =
      withdrawValue === '' ||
      parseFloat(withdrawValue) === 0 ||
      ethers.utils.parseUnits(withdrawValue || '0', staked.decimals).gt(staked.value) // This causes error if number of decimals > 18
  } catch (err) {
    isUnstakeInvalidAmount = true
  }

  const isUnstakeDisabled = isUnstakeInvalidAmount

  const canHarvest = (rewards: Reward[]): boolean => {
    return rewards.some(reward => reward?.amount.gt(BigNumber.from('0')))
  }

  const isHarvestDisabled = !canHarvest(farmRewards)

  const { deposit, withdraw, harvest } = useFairLaunch(farm.fairLaunchAddress)

  const handleStake = async (pid: number) => {
    if (!chainId || !account) {
      return
    }

    dispatch(setShowConfirm(true))
    dispatch(setAttemptingTxn(true))
    dispatch(setTxHash(''))

    try {
      const txHash = await deposit(pid, ethers.utils.parseUnits(depositValue, balance.decimals), pairSymbol, false)
      dispatch(setTxHash(txHash))
    } catch (err) {
      console.error(err)
      dispatch(setYieldPoolsError(err as Error))
    }

    dispatch(setAttemptingTxn(false))
  }

  const handleUnstake = async (pid: number) => {
    if (!chainId || !account) {
      return
    }

    dispatch(setShowConfirm(true))
    dispatch(setAttemptingTxn(true))
    dispatch(setTxHash(''))

    try {
      const txHash = await withdraw(pid, ethers.utils.parseUnits(withdrawValue, staked.decimals), pairSymbol)
      dispatch(setTxHash(txHash))
    } catch (err) {
      console.error(err)
      dispatch(setYieldPoolsError(err as Error))
    }

    dispatch(setAttemptingTxn(false))
  }

  const handleHarvest = async (pid: number) => {
    if (!chainId || !account) {
      return
    }

    dispatch(setShowConfirm(true))
    dispatch(setAttemptingTxn(true))
    dispatch(setTxHash(''))

    try {
      const txHash = await harvest(pid, pairSymbol)
      if (txHash) {
        mixpanelHandler(MIXPANEL_TYPE.INDIVIDUAL_REWARD_HARVESTED, {
          reward_tokens_and_amounts: JSON.stringify(
            farmRewards &&
              Object.assign(
                {},
                ...farmRewards.map(
                  reward =>
                    reward?.token?.symbol && {
                      [reward.token.symbol]: getFullDisplayBalance(reward.amount, reward.token.decimals),
                    },
                ),
              ),
          ),
        })
      }
      dispatch(setTxHash(txHash))
    } catch (err) {
      console.error(err)
      dispatch(setYieldPoolsError(err as Error))
    }

    dispatch(setAttemptingTxn(false))
  }

  const theme = useTheme()

  const now = +new Date() / 1000
  const toBeExtendTime = TOBE_EXTENDED_FARMING_POOLS[isAddressString(farm.id)]
  // only show if it will be ended less than 2 day
  const tobeExtended = toBeExtendTime && farm.endTime - now < 172800 && farm.endTime < toBeExtendTime

  const [modalType, setModalType] = useState<'stake' | 'unstake' | 'harvest' | null>(null)
  const modalTitle = () => {
    switch (modalType) {
      case 'stake':
        return <Trans>Stake</Trans>
      case 'unstake':
        return <Trans>Unstake</Trans>

      default:
        return <Trans>Harvest</Trans>
    }
  }

  const usd = () => {
    switch (modalType) {
      case 'stake':
        return formattedNum(userLPBalanceUSD.toString(), true)
      case 'unstake':
        return formattedNum(userStakedBalanceUSD.toString(), true)
      default:
        return formattedNum(rewardUSD.toString(), true)
    }
  }

  return (
    <>
      <Modal isOpen={!!modalType} onDismiss={() => setModalType(null)}>
        <ModalContentWrapper>
          <Flex alignItems="center" justifyContent="space-between" marginBottom="1rem">
            <Flex>
              <DoubleCurrencyLogo currency0={currency0} currency1={currency1} size={24} />
              <Text fontSize="20px" fontWeight="500">
                {modalTitle()}
              </Text>
            </Flex>
            <ButtonEmpty onClick={() => setModalType(null)} width="36px" height="36px" padding="0">
              <X color={theme.text} />
            </ButtonEmpty>
          </Flex>

          {modalType !== 'harvest' && <Divider />}

          <Flex justifyContent="space-between" alignItems="center" marginTop="1rem">
            <Text color={theme.subText} fontSize="0.75rem">
              {modalType === 'harvest' ? <Trans>My Rewards</Trans> : <Trans>Available Balance</Trans>}
            </Text>
            <Text fontSize="0.75rem" fontWeight="500">
              {usd()}
            </Text>
          </Flex>

          <RewardBalanceWrapper>
            {modalType === 'harvest' &&
              farmRewards.map((reward, index) => {
                return (
                  <React.Fragment key={reward.token.wrapped.address}>
                    <Flex alignItems="center" fontSize="12px" sx={{ gap: '4px' }}>
                      {chainId && reward.token.wrapped.address && <CurrencyLogo currency={reward.token} size="16px" />}
                      {getFullDisplayBalance(reward.amount, reward.token.decimals)}
                    </Flex>
                    {index !== farmRewards.length - 1 && <Text color={theme.subText}>|</Text>}
                  </React.Fragment>
                )
              })}

            {modalType && ['stake', 'unstake'].includes(modalType) && (
              <>
                <Flex alignItems="center" fontSize="12px" sx={{ gap: '4px' }}>
                  <CurrencyLogo currency={currency0} size="16px" />
                  <Text textAlign="right" fontSize="0.75rem" color={theme.subText}>
                    {formatTokenBalance(modalType === 'stake' ? userToken0Balance : userStakedToken0Balance)}
                  </Text>
                </Flex>
                <Text color={theme.subText}>|</Text>

                <Flex alignItems="center" fontSize="12px" sx={{ gap: '4px' }}>
                  <CurrencyLogo currency={currency1} size="16px" />
                  <Text textAlign="right" fontSize="0.75rem" color={theme.subText}>
                    {formatTokenBalance(modalType === 'stake' ? userToken1Balance : userStakedToken1Balance)}
                  </Text>
                </Flex>
              </>
            )}
          </RewardBalanceWrapper>

          {modalType !== 'harvest' && <Divider />}

          {modalType === 'harvest' ? (
            <ButtonPrimary
              margin="8px 0 0"
              onClick={() => {
                handleHarvest(farm.pid)
                setModalType(null)
              }}
            >
              Harvest
            </ButtonPrimary>
          ) : (
            <>
              <Flex marginTop="20px">
                {!account ? (
                  <ButtonLight onClick={toggleWalletModal}>
                    <Trans>Connect Wallet</Trans>
                  </ButtonLight>
                ) : (
                  approvalState === ApprovalState.UNKNOWN && <Dots></Dots>
                )}
                {(approvalState === ApprovalState.NOT_APPROVED || approvalState === ApprovalState.PENDING) && (
                  <ButtonPrimary
                    color="blue"
                    disabled={approvalState === ApprovalState.PENDING}
                    onClick={approve}
                    padding="12px"
                  >
                    {approvalState === ApprovalState.PENDING ? (
                      <Dots>
                        <Trans>Approving </Trans>
                      </Dots>
                    ) : (
                      <Trans>Approve</Trans>
                    )}
                  </ButtonPrimary>
                )}
                {approvalState === ApprovalState.APPROVED && chainId && (
                  <>
                    {modalType === 'stake' ? (
                      <CurrencyInputPanel
                        value={depositValue}
                        onUserInput={value => {
                          setDepositValue(value)
                        }}
                        onMax={() => {
                          setDepositValue(fixedFormatting(balance.value, balance.decimals))
                        }}
                        onHalf={() => {
                          setDepositValue(fixedFormatting(balance.value.div(2), balance.decimals))
                        }}
                        showMaxButton={true}
                        currency={new Token(chainId, farm.id, balance.decimals, `${pairSymbol}`, `${pairSymbol}`)}
                        id="stake-lp-input"
                        disableCurrencySelect
                        positionMax="top"
                        hideLogo={true}
                        fontSize="14px"
                        customCurrencySelect={
                          <ButtonPrimary
                            disabled={isStakeDisabled}
                            padding="8px 12px"
                            width="max-content"
                            style={{ minWidth: '80px' }}
                            onClick={() => handleStake(farm.pid)}
                          >
                            {depositValue && isStakeInvalidAmount ? 'Invalid Amount' : 'Stake'}
                          </ButtonPrimary>
                        }
                      />
                    ) : (
                      <CurrencyInputPanel
                        value={withdrawValue}
                        onUserInput={value => {
                          setWithdrawValue(value)
                        }}
                        onMax={() => {
                          setWithdrawValue(fixedFormatting(staked.value, staked.decimals))
                        }}
                        onHalf={() => {
                          setWithdrawValue(fixedFormatting(staked.value.div(2), staked.decimals))
                        }}
                        showMaxButton={true}
                        currency={new Token(chainId, farm.id, balance.decimals, `${pairSymbol}`, `${pairSymbol}`)}
                        id="unstake-lp-input"
                        disableCurrencySelect
                        customBalanceText={`${fixedFormatting(staked.value, staked.decimals)}`}
                        positionMax="top"
                        hideLogo={true}
                        fontSize="14px"
                        customCurrencySelect={
                          <ButtonPrimary
                            disabled={isUnstakeDisabled}
                            padding="8px 12px"
                            width="max-content"
                            style={{ minWidth: '80px' }}
                            onClick={() => handleUnstake(farm.pid)}
                          >
                            {withdrawValue && isUnstakeInvalidAmount ? 'Invalid Amount' : 'Unstake'}
                          </ButtonPrimary>
                        }
                      />
                    )}
                  </>
                )}
              </Flex>
              <Flex justifyContent="space-between" sx={{ gap: '8px' }} alignItems="center" marginTop="20px">
                <ExternalLink
                  href={
                    outsideFarm ? outsideFarm.poolInfoLink : `${DMM_ANALYTICS_URL[chainId as ChainId]}/pool/${farm.id}`
                  }
                >
                  <GetLP>
                    <Trans>Get pool {outsideFarm ? `(${outsideFarm.name})` : ''} info</Trans> ↗
                  </GetLP>
                </ExternalLink>
                {outsideFarm ? (
                  <ExternalLink href={outsideFarm.getLPTokenLink}>
                    <GetLP>
                      <Trans>
                        Get {farm.token0?.symbol}-{farm.token1?.symbol} {outsideFarm ? `(${outsideFarm.name})` : ''} LP
                        ↗
                      </Trans>
                    </GetLP>
                  </ExternalLink>
                ) : (
                  <Link
                    to={`/add/${currencyIdFromAddress(farm.token0?.id, chainId)}/${currencyIdFromAddress(
                      farm.token1?.id,
                      chainId,
                    )}/${farm.id}`}
                    style={{ textDecoration: 'none' }}
                  >
                    <GetLP style={{ textAlign: 'right' }}>
                      <Trans>
                        Get {farm.token0?.symbol}-{farm.token1?.symbol} LP ↗
                      </Trans>
                    </GetLP>
                  </Link>
                )}
              </Flex>
            </>
          )}
        </ModalContentWrapper>
      </Modal>

      {breakpoint ? (
        <>
          <TableRow>
            <DataText grid-area="pools">
              <div>
                <Flex alignItems="center">
                  <DoubleCurrencyLogo currency0={currency0} currency1={currency1} size={16} margin={true} />
                  <span>
                    {farm.token0?.symbol} - {farm.token1?.symbol}
                  </span>

                  {(tobeExtended || farm.startTime > currentTimestamp) && (
                    <MouseoverTooltip
                      text={tobeExtended ? t`To be extended` : farm.time}
                      width="fit-content"
                      placement="top"
                    >
                      <Clock size={14} style={{ marginLeft: '6px' }} />
                    </MouseoverTooltip>
                  )}
                </Flex>
                <Text marginLeft="36px" marginTop="4px" color={theme.subText} fontSize={12}>
                  AMP = {amp}
                </Text>
              </div>
            </DataText>
            <DataText grid-area="liq">{formattedNum(liquidity.toString(), true)}</DataText>
            {/* <DataText grid-area="end" align="left" flexDirection="column" alignItems="flex-start">
              {farm.time}
              {tobeExtended && (
                <Text color={theme.subText} fontSize="12px" marginTop="6px">
                  <Trans>To be extended</Trans>
                </Text>
              )}
            </DataText>
            */}
            <APY grid-area="apy" align="right">
              {apr.toFixed(2)}%
              {apr !== 0 && (
                <InfoHelper
                  text={
                    tradingFeeAPR < MAX_ALLOW_APY
                      ? t`${tradingFeeAPR.toFixed(2)}% LP Fee + ${farmAPR.toFixed(2)}% Rewards`
                      : `${farmAPR.toFixed(2)}% Rewards`
                  }
                />
              )}
            </APY>
            <DataText grid-area="vesting_duration" align="right">
              {getFormattedTimeFromSecond(farm.vestingDuration, true)}
            </DataText>

            <DataText grid-area="staked_balance" align="right">
              {formattedNum(userStakedBalanceUSD.toString(), true)}
            </DataText>

            <DataText
              grid-area="reward"
              align="right"
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}
            >
              {farmRewards.map(reward => {
                return (
                  <div key={reward.token.wrapped.address} style={{ marginTop: '2px' }}>
                    <Flex alignItems="center">
                      {getFullDisplayBalance(reward.amount, reward.token.decimals)}
                      {chainId && reward.token.wrapped.address && (
                        <CurrencyLogo currency={reward.token} size="16px" style={{ marginLeft: '3px' }} />
                      )}
                    </Flex>
                  </div>
                )
              })}
            </DataText>
            <Flex justifyContent="flex-end" sx={{ gap: '4px' }}>
              <ActionButton
                disabled={tab === 'ended'}
                onClick={() => {
                  setModalType('stake')
                }}
              >
                <MouseoverTooltip text={t`Stake`} placement="top" width="fit-content">
                  <Plus color={tab !== 'ended' ? theme.primary : theme.subText} size={16} />
                </MouseoverTooltip>
              </ActionButton>

              <ActionButton
                backgroundColor={theme.subText + '33'}
                onClick={() => {
                  setModalType('unstake')
                }}
              >
                <MouseoverTooltip text={t`Unstake`} placement="top" width="fit-content">
                  <Minus color={theme.subText} size={16} />
                </MouseoverTooltip>
              </ActionButton>

              <ActionButton
                backgroundColor={theme.subText + '33'}
                disabled={isHarvestDisabled}
                onClick={() => {
                  setModalType('harvest')
                }}
              >
                <MouseoverTooltip text={t`Harvest`} placement="top" width="fit-content">
                  <Harvest color={theme.subText} />
                </MouseoverTooltip>
              </ActionButton>
            </Flex>
          </TableRow>
        </>
      ) : (
        <>
          <StyledItemCard>
            <Flex alignItems="center">
              <DoubleCurrencyLogo currency0={currency0} currency1={currency1} size={24} margin={true} />
              <Text fontWeight={500}>
                {farm.token0?.symbol} - {farm.token1?.symbol}
              </Text>
              {(tobeExtended || farm.startTime > currentTimestamp) && (
                <MouseoverTooltip
                  text={tobeExtended ? t`To be extended` : farm.time}
                  width="fit-content"
                  placement="top"
                >
                  <Clock size={14} style={{ marginLeft: '6px' }} />
                </MouseoverTooltip>
              )}
            </Flex>

            <Flex marginTop="8px" marginBottom="16px" fontSize={12} color={theme.subText}>
              AMP = {amp} | {shortenAddress(farm.id)} <CopyHelper toCopy={farm.id} />
            </Flex>

            <Divider />

            <Flex justifyContent="space-between" fontSize={12} marginTop="16px">
              <Text color={theme.subText}>
                <Trans>Staked TVL</Trans>
              </Text>

              <Text fontWeight="500">{formattedNum(liquidity.toString(), true)}</Text>
            </Flex>

            {/* <Flex justifyContent="space-between" fontSize={12} marginTop="12px">
              <Text color={theme.subText}>
                <Trans>Ending In</Trans>
              </Text>

              <Text fontSize="12px">
                {farm.time}
                {tobeExtended && (
                  <Text color={theme.subText} fontSize="12px" marginTop="6px">
                    <Trans>To be extended</Trans>
                  </Text>
                )}
              </Text>
            </Flex>
            */}

            <Flex justifyContent="space-between" fontSize={12} marginTop="12px">
              <Text color={theme.subText}>
                <Trans>APR</Trans>
                <InfoHelper
                  text={'Once a farm has ended, you will continue to receive returns through LP Fees'}
                  size={12}
                />
              </Text>

              <Text color={theme.apr} fontWeight="500">
                {apr.toFixed(2)}%
                {apr !== 0 && (
                  <InfoHelper text={t`${tradingFeeAPR.toFixed(2)}% LP Fee + ${farmAPR.toFixed(2)}% Rewards`} />
                )}
              </Text>
            </Flex>

            <Flex justifyContent="space-between" fontSize={12} marginTop="12px">
              <Text color={theme.subText}>
                <Trans>Vesting</Trans>
                <InfoHelper
                  text={t`After harvesting, your rewards will unlock linearly over the indicated time period`}
                  size={12}
                />
              </Text>

              <Text fontSize="12px" fontWeight="500">
                {getFormattedTimeFromSecond(farm.vestingDuration, true)}
              </Text>
            </Flex>

            <Flex justifyContent="space-between" fontSize={12} marginTop="12px">
              <Text color={theme.subText}>
                <Trans>My Deposit</Trans>
              </Text>

              <Text fontSize="12px" fontWeight="500">
                {formattedNum(userStakedBalanceUSD.toString(), true)}
              </Text>
            </Flex>

            <Flex justifyContent="space-between" fontSize={12} marginTop="12px">
              <Text color={theme.subText}>
                <Trans>My Rewards</Trans>
              </Text>

              <Text fontSize="12px" fontWeight="500">
                {formattedNum(rewardUSD.toString(), true)}
              </Text>
            </Flex>

            <RewardBalanceWrapper>
              {farmRewards.map((reward, index) => {
                return (
                  <React.Fragment key={reward.token.wrapped.address}>
                    <Flex alignItems="center" fontSize="12px" sx={{ gap: '4px' }}>
                      {chainId && reward.token.wrapped.address && <CurrencyLogo currency={reward.token} size="16px" />}
                      {getFullDisplayBalance(reward.amount, reward.token.decimals)}
                    </Flex>
                    {index !== farmRewards.length - 1 && <Text color={theme.subText}>|</Text>}
                  </React.Fragment>
                )
              })}

              <ButtonLight
                margin="8px 0 0"
                disabled={isHarvestDisabled}
                onClick={() => {
                  handleHarvest(farm.pid)
                }}
              >
                <Harvest />
                <Text marginLeft="8px">Harvest</Text>
              </ButtonLight>
            </RewardBalanceWrapper>

            <Flex sx={{ gap: '1rem' }} marginTop="16px">
              <ButtonOutlined onClick={() => setModalType('unstake')} flex={1}>
                <Trans>Unstake</Trans>
              </ButtonOutlined>
              <ButtonPrimary onClick={() => setModalType('stake')} flex={1}>
                <Trans>Stake</Trans>
              </ButtonPrimary>
            </Flex>
          </StyledItemCard>
        </>
      )}
    </>
  )
}

export default ListItem
