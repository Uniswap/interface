import { CurrencyAmount, Token } from '@kyberswap/ks-sdk-core'
import { Pool, Position } from '@kyberswap/ks-sdk-elastic'
import { Trans, t } from '@lingui/macro'
import { BigNumber } from 'ethers'
import React, { useEffect, useMemo, useState } from 'react'
import { Minus, Plus, Share2 } from 'react-feather'
import { Link } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ButtonPrimary } from 'components/Button'
import CopyHelper from 'components/Copy'
import CurrencyLogo from 'components/CurrencyLogo'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import HoverInlineText from 'components/HoverInlineText'
import { MoneyBag } from 'components/Icons'
import Harvest from 'components/Icons/Harvest'
import InfoHelper from 'components/InfoHelper'
import Modal from 'components/Modal'
import { MouseoverTooltip, MouseoverTooltipDesktopOnly } from 'components/Tooltip'
import { ELASTIC_BASE_FEE_UNIT } from 'constants/index'
import { VERSION } from 'constants/v2'
import { useToken } from 'hooks/Tokens'
import useParsedQueryString from 'hooks/useParsedQueryString'
import useTheme from 'hooks/useTheme'
import { useRewardTokenPrices } from 'state/farms/hooks'
import { useProMMFarmTVL } from 'state/farms/promm/hooks'
import { ProMMFarm } from 'state/farms/promm/types'
import { ExternalLink } from 'theme'
import { shortenAddress } from 'utils'
import { getFormattedTimeFromSecond } from 'utils/formatTime'
import { formatDollarAmount } from 'utils/numbers'

import { APRTooltipContent } from '../FarmingPoolAPRCell'
import { ModalContentWrapper } from '../ProMMFarmModals/styled'
import { useSharePoolContext } from '../SharePoolContext'
import { InfoRow, ProMMFarmTableRow, ProMMFarmTableRowMobile, RewardMobileArea } from '../styleds'
import { ActionButton, ButtonColorScheme, MinimalActionButton } from './buttons'

const ButtonGroupContainerOnMobile = styled.div`
  display: flex;
  margin-top: 1.25rem;
  gap: 16px;

  /* this is to make sure all buttons (including those with tooltips) take up even space */
  > * {
    flex: 1;
  }
`

const Reward = ({ token: address, amount }: { token: string; amount?: BigNumber }) => {
  const token = useToken(address)

  const tokenAmout = token && CurrencyAmount.fromRawAmount(token, amount?.toString() || '0')

  return (
    <Flex alignItems="center" sx={{ gap: '4px' }}>
      <HoverInlineText text={tokenAmout?.toSignificant(6) || '0'} maxCharacters={10}></HoverInlineText>
      <MouseoverTooltip placement="top" text={token?.symbol} width="fit-content">
        <CurrencyLogo currency={token} size="16px" />
      </MouseoverTooltip>
    </Flex>
  )
}

const Row = ({
  isApprovedForAll,
  fairlaunchAddress,
  farm,
  onOpenModal,
  onHarvest,
  onUpdateDepositedInfo,
  isUserAffectedByFarmIssue,
}: {
  isUserAffectedByFarmIssue: boolean
  isApprovedForAll: boolean
  fairlaunchAddress: string
  farm: ProMMFarm
  onOpenModal: (modalType: 'deposit' | 'withdraw' | 'stake' | 'unstake', pid?: number) => void
  onHarvest: () => void
  onUpdateDepositedInfo: (input: {
    poolAddress: string
    usdValue: number
    token0Amount: CurrencyAmount<Token>
    token1Amount: CurrencyAmount<Token>
  }) => void
}) => {
  const theme = useTheme()
  const currentTimestamp = Math.floor(Date.now() / 1000)
  const above1000 = useMedia('(min-width: 1000px)')
  const qs = useParsedQueryString()
  const tab = qs.type || 'active'

  const token0 = useToken(farm.token0)
  const token1 = useToken(farm.token1)

  const { tvl, farmAPR, poolAPY } = useProMMFarmTVL(fairlaunchAddress, farm.pid)

  const prices = useRewardTokenPrices([token0?.wrapped, token1?.wrapped], VERSION.ELASTIC)

  const pool = useMemo(() => {
    if (token0 && token1)
      return new Pool(
        token0.wrapped,
        token1.wrapped,
        farm.feeTier,
        farm.sqrtP.toString(),
        farm.baseL.toString(),
        farm.reinvestL.toString(),
        farm.currentTick,
      )
    return null
  }, [token0, token1, farm])

  const position: {
    token0Amount: CurrencyAmount<Token>
    token1Amount: CurrencyAmount<Token>
    amountUsd: number
    rewardAmounts: BigNumber[]
    token0Staked: CurrencyAmount<Token>
    token1Staked: CurrencyAmount<Token>
    stakedUsd: number
  } | null = useMemo(() => {
    if (pool && token0 && token1) {
      let token0Amount = CurrencyAmount.fromRawAmount(token0.wrapped, '0')
      let token1Amount = CurrencyAmount.fromRawAmount(token1.wrapped, '0')

      let token0Staked = CurrencyAmount.fromRawAmount(token0.wrapped, '0')
      let token1Staked = CurrencyAmount.fromRawAmount(token1.wrapped, '0')

      const rewardAmounts = farm.rewardTokens.map(_item => BigNumber.from('0'))

      farm.userDepositedNFTs.forEach(item => {
        const pos = new Position({
          pool,
          liquidity: item.liquidity.toString(),
          tickLower: item.tickLower,
          tickUpper: item.tickUpper,
        })

        token0Amount = token0Amount.add(pos.amount0)
        token1Amount = token1Amount.add(pos.amount1)

        item.rewardPendings.forEach((rw, index) => (rewardAmounts[index] = rewardAmounts[index].add(rw)))
      })

      const amount0Usd = prices[0] * parseFloat(token0Amount.toExact())
      const amount1Usd = prices[1] * parseFloat(token1Amount.toExact())

      farm.userDepositedNFTs.forEach(item => {
        const pos = new Position({
          pool,
          liquidity: item.stakedLiquidity.toString(),
          tickLower: item.tickLower,
          tickUpper: item.tickUpper,
        })

        token0Staked = token0Staked.add(pos.amount0)
        token1Staked = token1Staked.add(pos.amount1)
      })

      const amount0StakedUsd = prices[0] * parseFloat(token0Staked.toExact())
      const amount1StakedUsd = prices[1] * parseFloat(token1Staked.toExact())

      return {
        token1Amount,
        amountUsd: amount0Usd + amount1Usd,
        token0Amount,
        rewardAmounts,
        token0Staked,
        token1Staked,
        stakedUsd: amount0StakedUsd + amount1StakedUsd,
      }
    }
    return null
  }, [pool, token0, token1, prices, farm])

  const canStake =
    farm.userDepositedNFTs.filter(item => item.liquidity.sub(item.stakedLiquidity).gt(BigNumber.from(0))).length > 0
  const canHarvest = farm.userDepositedNFTs.some(pos => !!pos.rewardPendings.length)
  const canUnstake = farm.userDepositedNFTs.some(pos => pos.stakedLiquidity.gt(0))
  const isFarmStarted = farm.startTime <= currentTimestamp

  const setSharePoolAddress = useSharePoolContext()

  useEffect(() => {
    if (position)
      onUpdateDepositedInfo({
        poolAddress: farm.poolAddress,
        usdValue: position.amountUsd || 0,
        token0Amount: position.token0Amount,
        token1Amount: position.token1Amount,
      })
  }, [position, farm.poolAddress, onUpdateDepositedInfo])

  const [showTargetVolInfo, setShowTargetVolInfo] = useState(false)

  const amountCanStaked = (position?.amountUsd || 0) - (position?.stakedUsd || 0)

  if (!above1000) {
    const renderStakeButtonOnMobile = () => {
      if (isUserAffectedByFarmIssue) {
        return (
          <MouseoverTooltipDesktopOnly
            text={t`This farm is currently under maintenance. You can deposit your liquidity into the new farms instead. Your withdrawals are not affected.`}
            placement="top"
            width="300px"
          >
            <ActionButton
              style={{
                // simulate disabled state
                // MouseoverTooltipDesktopOnly will not work well with `disabled` attribute
                cursor: 'not-allowed',
                width: '100%',
                backgroundColor: theme.buttonGray,
                color: theme.border,
              }}
            >
              <Plus width={20} height={20} />
              <Text fontSize={14}>
                <Trans>Stake</Trans>
              </Text>
            </ActionButton>
          </MouseoverTooltipDesktopOnly>
        )
      }

      return (
        <ActionButton
          disabled={!isApprovedForAll || tab === 'ended' || !isFarmStarted || !canStake}
          style={{ flex: 1 }}
          onClick={() => onOpenModal('stake', farm.pid)}
        >
          <Plus width={20} height={20} />
          <Text fontSize={14}>
            <Trans>Stake</Trans>
          </Text>
        </ActionButton>
      )
    }

    return (
      <>
        <Modal onDismiss={() => setShowTargetVolInfo(false)} isOpen={showTargetVolInfo}>
          <ModalContentWrapper>
            <Text fontSize="12px" marginBottom="24px" lineHeight={1.5}>
              <Trans>
                Some farms have a target trading volume (represented by the progress bar) that your liquidity positions
                need to fully unlock to start earning maximum farming rewards. This target volume ensures that your
                liquidity positions are supporting the pools trading volume.
                <br />
                <br />
                Based on the progress of your target volume, you will still earn partial farming rewards. But once you
                fully unlock your target volume, your liquidity position(s) will start earning maximum rewards.
                Adjusting your liquidity position(s) staked in the farm will recalculate this volume target.
              </Trans>
            </Text>

            <ButtonPrimary
              as={ExternalLink}
              href="https://docs.kyberswap.com/guides/farming-mechanisms"
              style={{ color: theme.textReverse }}
            >
              <Trans>Learn More</Trans>
            </ButtonPrimary>
          </ModalContentWrapper>
        </Modal>

        <ProMMFarmTableRowMobile>
          <Flex alignItems="center" marginBottom="20px">
            <DoubleCurrencyLogo currency0={token0} currency1={token1} size={20} />
            <Link to={`/elastic/add/${farm.token0}/${farm.token1}/${farm.feeTier}`}>
              <Text fontSize={16} fontWeight="500">
                {token0?.symbol} - {token1?.symbol}
              </Text>
            </Link>
          </Flex>

          <Flex
            marginTop="0.5rem"
            alignItems="center"
            sx={{ gap: '4px' }}
            fontSize="12px"
            color={theme.subText}
            width="max-content"
          >
            <Text>Fee = {(farm.feeTier * 100) / ELASTIC_BASE_FEE_UNIT}%</Text>
            <Text color={theme.subText}>|</Text>

            <Flex alignItems="center">
              <Text>{shortenAddress(farm.poolAddress, 2)}</Text>
              <CopyHelper toCopy={farm.poolAddress} />
            </Flex>
          </Flex>

          <InfoRow>
            <Text color={theme.subText}>
              <Trans>Staked TVL</Trans>
            </Text>
            <Text>{formatDollarAmount(tvl)}</Text>
          </InfoRow>

          <InfoRow>
            <Text color={theme.subText}>
              <Trans>AVG APR</Trans>
              <InfoHelper
                text={
                  qs.type === 'active'
                    ? t`Average estimated return based on yearly fees and bonus rewards of the pool`
                    : t`Average estimated return based on yearly fees of the pool plus bonus rewards from the farm`
                }
              />
            </Text>
            <Flex alignItems={'center'} sx={{ gap: '4px' }} color={theme.apr}>
              <Text as="span">{(farmAPR + poolAPY).toFixed(2)}%</Text>
              <MouseoverTooltip
                width="fit-content"
                placement="top"
                text={<APRTooltipContent farmAPR={farmAPR} poolAPR={poolAPY} />}
              >
                <MoneyBag size={16} color={theme.apr} />
              </MouseoverTooltip>
            </Flex>
          </InfoRow>

          <InfoRow>
            <Text color={theme.subText}>
              <Trans>Vesting</Trans>
              <InfoHelper
                text={t`After harvesting, your rewards will unlock linearly over the indicated time period`}
              />
            </Text>
            <Text>{getFormattedTimeFromSecond(farm.vestingDuration, true)}</Text>
          </InfoRow>

          <InfoRow>
            <Text color={theme.subText}>
              <Trans>Ending In</Trans>
              <InfoHelper text={t`Once a farm has ended, you will continue to receive returns through LP Fees`} />
            </Text>

            <Flex flexDirection="column" alignItems="flex-end" justifyContent="center" sx={{ gap: '8px' }}>
              {farm.startTime > currentTimestamp ? (
                <>
                  <Text color={theme.subText} fontSize="12px">
                    <Trans>New phase will start in</Trans>
                  </Text>
                  {getFormattedTimeFromSecond(farm.startTime - currentTimestamp)}
                </>
              ) : farm.endTime > currentTimestamp ? (
                <>
                  <Text color={theme.subText} fontSize="12px">
                    <Trans>Current phase will end in</Trans>
                  </Text>
                  {getFormattedTimeFromSecond(farm.endTime - currentTimestamp)}
                </>
              ) : (
                <Trans>ENDED</Trans>
              )}
            </Flex>
          </InfoRow>

          <InfoRow>
            <Text color={theme.subText}>
              <Trans>My Deposit</Trans>
            </Text>

            <Flex justifyContent="flex-end" color={!!amountCanStaked ? theme.warning : theme.text}>
              {!!position?.amountUsd ? formatDollarAmount(position.amountUsd) : '--'}
              {!!amountCanStaked && (
                <InfoHelper
                  color={theme.warning}
                  text={t`You still have ${formatDollarAmount(
                    amountCanStaked,
                  )} liquidity to stake to earn more rewards`}
                />
              )}
            </Flex>
          </InfoRow>

          <InfoRow>
            <Text color={theme.subText}>
              <Trans>My Rewards</Trans>
            </Text>
          </InfoRow>

          <RewardMobileArea>
            <Flex justifyContent="center" alignItems="center" marginBottom="8px" sx={{ gap: '4px' }}>
              {farm.rewardTokens.map((token, idx) => {
                return (
                  <React.Fragment key={token}>
                    <Reward key={token} token={token} amount={position?.rewardAmounts[idx]} />
                    {idx !== farm.rewardTokens.length - 1 && <Text color={theme.subText}>|</Text>}
                  </React.Fragment>
                )
              })}
            </Flex>

            <ActionButton
              style={{ width: '100%' }}
              colorScheme={ButtonColorScheme.Gray}
              onClick={onHarvest}
              disabled={!canHarvest}
            >
              <Harvest />
              <Text as="span" fontSize="14px">
                <Trans>Harvest</Trans>
              </Text>
            </ActionButton>
          </RewardMobileArea>

          <ButtonGroupContainerOnMobile>
            <ActionButton
              colorScheme={ButtonColorScheme.Red}
              style={{ flex: 1 }}
              onClick={() => onOpenModal('unstake', farm.pid)}
              disabled={!canUnstake}
            >
              <Minus width={20} height={20} />
              <Text fontSize={14}>
                <Trans>Unstake</Trans>
              </Text>
            </ActionButton>
            {renderStakeButtonOnMobile()}
          </ButtonGroupContainerOnMobile>
        </ProMMFarmTableRowMobile>
      </>
    )
  }

  const renderStakeButton = () => {
    if (isUserAffectedByFarmIssue) {
      return (
        <MouseoverTooltipDesktopOnly
          text={t`This farm is currently under maintenance. You can deposit your liquidity into the new farms instead. Your withdrawals are not affected.`}
          placement="top"
          width="300px"
        >
          <MinimalActionButton
            style={{
              cursor: 'not-allowed',
              backgroundColor: theme.buttonGray,
              opacity: 0.4,
            }}
          >
            <Plus size={16} />
          </MinimalActionButton>
        </MouseoverTooltipDesktopOnly>
      )
    }

    if (!isApprovedForAll || tab === 'ended' || !canStake) {
      return (
        <MinimalActionButton disabled>
          <Plus size={16} />
        </MinimalActionButton>
      )
    }

    if (!isFarmStarted) {
      return (
        <MouseoverTooltipDesktopOnly text={t`Farm has not started`} placement="top" width="fit-content">
          <MinimalActionButton
            style={{
              cursor: 'not-allowed',
              backgroundColor: theme.buttonGray,
              color: theme.border,
            }}
          >
            <Plus size={16} />
          </MinimalActionButton>
        </MouseoverTooltipDesktopOnly>
      )
    }

    return (
      <MouseoverTooltipDesktopOnly
        text={t`Stake your liquidity positions (i.e. your NFT tokens) into the farm to start earning rewards`}
        placement="top"
        width="300px"
      >
        <MinimalActionButton onClick={() => onOpenModal('stake', farm.pid)}>
          <Plus size={16} />
        </MinimalActionButton>
      </MouseoverTooltipDesktopOnly>
    )
  }

  const renderUnstakeButton = () => {
    if (!canUnstake) {
      return (
        <MinimalActionButton colorScheme={ButtonColorScheme.Red} disabled={!canUnstake}>
          <Minus size={16} />
        </MinimalActionButton>
      )
    }

    return (
      <MouseoverTooltipDesktopOnly
        text={t`Unstake your liquidity positions (i.e. your NFT tokens) from the farm`}
        placement="top"
        width="300px"
      >
        <MinimalActionButton colorScheme={ButtonColorScheme.Red} onClick={() => onOpenModal('unstake', farm.pid)}>
          <Minus size={16} />
        </MinimalActionButton>
      </MouseoverTooltipDesktopOnly>
    )
  }

  const renderHarvestButton = () => {
    if (!canHarvest) {
      return (
        <MinimalActionButton colorScheme={ButtonColorScheme.Gray} disabled>
          <Harvest />
        </MinimalActionButton>
      )
    }

    return (
      <MouseoverTooltipDesktopOnly text={t`Harvest`} placement="top" width="fit-content">
        <MinimalActionButton colorScheme={ButtonColorScheme.Gray} onClick={onHarvest}>
          <Harvest />
        </MinimalActionButton>
      </MouseoverTooltipDesktopOnly>
    )
  }

  return (
    <ProMMFarmTableRow>
      <div>
        <Flex alignItems="center">
          <DoubleCurrencyLogo currency0={token0} currency1={token1} />
          <Link
            to={`/elastic/add/${farm.token0}/${farm.token1}/${farm.feeTier}`}
            style={{
              textDecoration: 'none',
            }}
          >
            <Text fontSize={14} fontWeight={500}>
              {token0?.symbol} - {token1?.symbol}
            </Text>
          </Link>

          <Flex
            onClick={() => {
              setSharePoolAddress(farm.poolAddress)
            }}
            sx={{
              marginLeft: '8px',
              cursor: 'pointer',
            }}
            role="button"
          >
            <Share2 size="14px" color={theme.subText} />
          </Flex>
        </Flex>

        <Flex
          marginTop="0.5rem"
          alignItems="center"
          sx={{ gap: '3px' }}
          fontSize="12px"
          color={theme.subText}
          width="max-content"
        >
          <Text>Fee = {(farm.feeTier * 100) / ELASTIC_BASE_FEE_UNIT}%</Text>
          <Text color={theme.subText}>|</Text>

          <Flex alignItems="center">
            <Text>{shortenAddress(farm.poolAddress, 2)}</Text>
            <CopyHelper toCopy={farm.poolAddress} />
          </Flex>
        </Flex>
      </div>

      <Text textAlign="right">{formatDollarAmount(tvl)}</Text>
      <Flex
        alignItems="center"
        justifyContent="flex-end"
        color={theme.apr}
        sx={{
          gap: '4px',
        }}
      >
        {(farmAPR + poolAPY).toFixed(2)}%
        <MouseoverTooltip
          width="fit-content"
          placement="right"
          text={<APRTooltipContent farmAPR={farmAPR} poolAPR={poolAPY} />}
        >
          <MoneyBag size={16} color={theme.apr} />
        </MouseoverTooltip>
      </Flex>

      <Flex flexDirection="column" alignItems="flex-end" justifyContent="center" sx={{ gap: '8px' }}>
        {farm.startTime > currentTimestamp ? (
          <>
            <Text color={theme.subText} fontSize="12px">
              <Trans>New phase will start in</Trans>
            </Text>
            {getFormattedTimeFromSecond(farm.startTime - currentTimestamp)}
          </>
        ) : farm.endTime > currentTimestamp ? (
          <>
            <Text color={theme.subText} fontSize="12px">
              <Trans>Current phase will end in</Trans>
            </Text>
            {getFormattedTimeFromSecond(farm.endTime - currentTimestamp)}
          </>
        ) : (
          <Trans>ENDED</Trans>
        )}
      </Flex>

      {amountCanStaked ? (
        <Flex justifyContent="flex-end" color={theme.warning}>
          {formatDollarAmount(position?.amountUsd || 0)}
          <InfoHelper
            placement="top"
            color={theme.warning}
            width={'270px'}
            text={
              <Flex
                sx={{
                  flexDirection: 'column',
                  gap: '6px',
                  fontSize: '12px',
                  lineHeight: '16px',
                  fontWeight: 400,
                }}
              >
                <Text as="span" color={theme.subText}>
                  <Trans>
                    You still have {formatDollarAmount(amountCanStaked)} in liquidity to stake to earn even more farming
                    rewards
                  </Trans>
                </Text>
                <Text as="span" color={theme.text}>
                  Staked: {formatDollarAmount(position?.amountUsd || 0)}
                </Text>
                <Text as="span" color={theme.warning}>
                  Not staked: {formatDollarAmount(amountCanStaked)}
                </Text>
              </Flex>
            }
          />
        </Flex>
      ) : (
        <Flex justifyContent="flex-end" color={theme.text}>
          {position?.amountUsd ? formatDollarAmount(position.amountUsd) : '--'}
        </Flex>
      )}

      <Flex flexDirection="column" alignItems="flex-end" sx={{ gap: '8px' }}>
        {farm.rewardTokens.map((token, idx) => (
          <Reward key={token} token={token} amount={position?.rewardAmounts[idx]} />
        ))}
      </Flex>
      <Flex justifyContent="flex-end" sx={{ gap: '4px' }}>
        {renderStakeButton()}
        {renderUnstakeButton()}
        {renderHarvestButton()}
      </Flex>
    </ProMMFarmTableRow>
  )
}

export default Row
