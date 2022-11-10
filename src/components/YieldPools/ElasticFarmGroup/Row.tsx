import { ChainId, CurrencyAmount, Fraction } from '@kyberswap/ks-sdk-core'
import { computePoolAddress } from '@kyberswap/ks-sdk-elastic'
import { Trans, t } from '@lingui/macro'
import { BigNumber } from 'ethers'
import { useEffect, useState } from 'react'
import { Info, Minus, Plus, Share2 } from 'react-feather'
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
import { NETWORKS_INFO } from 'constants/networks'
import { TOBE_EXTENDED_FARMING_POOLS } from 'constants/v2'
import { useActiveWeb3React } from 'hooks'
import { useProMMFarmContract } from 'hooks/useContract'
import useParsedQueryString from 'hooks/useParsedQueryString'
import useTheme from 'hooks/useTheme'
import { useElasticFarms } from 'state/farms/elastic/hooks'
import { FarmingPool } from 'state/farms/elastic/types'
import { ExternalLink } from 'theme'
import { shortenAddress } from 'utils'
import { getFormattedTimeFromSecond } from 'utils/formatTime'
import { formatDollarAmount } from 'utils/numbers'

import { ModalContentWrapper } from '../ElasticFarmModals/styled'
import { APRTooltipContent } from '../FarmingPoolAPRCell'
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

const FeeTargetWrapper = styled.div<{ fullUnlock: boolean }>`
  border-radius: 999px;
  display: flex;
  font-size: 12px;
  background: ${({ theme, fullUnlock }) => (fullUnlock ? theme.primary : theme.subText)};
  position: relative;
  color: ${({ theme }) => theme.textReverse};
  height: 4px;
  align-items: center;
  min-width: 140px;
  max-width: 200px;
  position: relative;
  margin-top: 4px;
  overflow: hidden;
`

const FeeArchive = styled.div<{ width: number }>`
  width: ${({ width }) => `${width}%`};
  height: 100%;
  background: ${({ theme, width }) => (width === 100 ? theme.primary : theme.warning)};
  border-radius: 999px;
`

const FeeTarget = ({ percent }: { percent: string }) => {
  const p = Number(percent)
  const theme = useTheme()
  return (
    <>
      <Flex justifyContent="space-between" fontSize="12px" color={theme.subText} marginTop="4px" maxWidth="200px">
        <Trans>Target Volume</Trans>
        {p >= 100 ? <Text color={theme.primary}>✓</Text> : <div>{p.toFixed(2)}%</div>}
      </Flex>
      <FeeTargetWrapper fullUnlock={p >= 100}>
        <FeeArchive width={p}></FeeArchive>
      </FeeTargetWrapper>
    </>
  )
}

interface Pool extends FarmingPool {
  tvl: number
  poolAPR: number
  farmAPR: number
  depositedUsd: number
  stakedUsd: number
}

const Row = ({
  isApprovedForAll,
  fairlaunchAddress,
  pool: farmingPool,
  onOpenModal,
  onHarvest,
  isUserAffectedByFarmIssue,
}: {
  isUserAffectedByFarmIssue: boolean
  isApprovedForAll: boolean
  fairlaunchAddress: string
  pool: Pool
  onOpenModal: (modalType: 'deposit' | 'withdraw' | 'stake' | 'unstake', pid?: number | string) => void
  onHarvest: () => void
}) => {
  const theme = useTheme()
  const currentTimestamp = Math.floor(Date.now() / 1000)
  const above1000 = useMedia('(min-width: 1000px)')
  const qs = useParsedQueryString()
  const tab = qs.type || 'active'

  const { chainId } = useActiveWeb3React()

  const { userFarmInfo } = useElasticFarms()

  const joinedPositions = userFarmInfo?.[fairlaunchAddress]?.joinedPositions[farmingPool.pid] || []
  const depositedPositions =
    userFarmInfo?.[fairlaunchAddress]?.depositedPositions.filter(pos => {
      return (
        farmingPool.poolAddress.toLowerCase() ===
        computePoolAddress({
          factoryAddress: NETWORKS_INFO[chainId || ChainId.MAINNET].elastic.coreFactory,
          tokenA: pos.pool.token0,
          tokenB: pos.pool.token1,
          fee: pos.pool.fee,
          initCodeHashManualOverride: NETWORKS_INFO[chainId || ChainId.MAINNET].elastic.initCodeHash,
        }).toLowerCase()
      )
    }) || []

  const rewardPendings =
    userFarmInfo?.[fairlaunchAddress]?.rewardPendings[farmingPool.pid] ||
    farmingPool.rewardTokens.map(token => CurrencyAmount.fromRawAmount(token, 0))

  const contract = useProMMFarmContract(fairlaunchAddress)
  const [targetPercent, setTargetPercent] = useState('')

  useEffect(() => {
    const getFeeTargetInfo = async () => {
      if (!contract || farmingPool.feeTarget === '0') return
      const userJoinedPos = userFarmInfo?.[fairlaunchAddress].joinedPositions[farmingPool.pid] || []

      if (!userJoinedPos.length) {
        setTargetPercent('')
        return
      }

      const res = await Promise.all(
        userJoinedPos.map(async pos => {
          const res = await contract.getRewardCalculationData(pos.nftId, farmingPool.pid)
          return new Fraction(res.vestingVolume.toString(), BigNumber.from(1e12).toString())
        }),
      )

      const totalLiquidity =
        userJoinedPos.reduce((acc, cur) => acc.add(cur.liquidity.toString()), BigNumber.from(0)) || BigNumber.from(0)

      const targetLiqid = userJoinedPos.reduce(
        (acc, cur, index) => acc.add(res[index].multiply(cur.liquidity.toString())),
        new Fraction(0, 1),
      )

      if (totalLiquidity.gt(0)) {
        const t = targetLiqid.multiply(100).divide(totalLiquidity.toString())
        setTargetPercent(t.toFixed(2))
      }
    }

    getFeeTargetInfo()
  }, [contract, farmingPool.feeTarget, fairlaunchAddress, farmingPool.pid, userFarmInfo])

  const canStake = depositedPositions.some(pos => {
    const stakedPos = joinedPositions.find(j => j.nftId.toString() === pos.nftId.toString())
    return !stakedPos
      ? true
      : BigNumber.from(pos.liquidity.toString()).gt(BigNumber.from(stakedPos.liquidity.toString()))
  })

  const canHarvest = rewardPendings.some(amount => amount.greaterThan(0))

  const canUnstake = !!joinedPositions.length
  const isFarmStarted = farmingPool.startTime <= currentTimestamp

  const setSharePoolAddress = useSharePoolContext()

  const [showTargetVolInfo, setShowTargetVolInfo] = useState(false)

  const amountCanStaked = farmingPool.depositedUsd - farmingPool.stakedUsd

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
          onClick={() => onOpenModal('stake', farmingPool.pid)}
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
            <DoubleCurrencyLogo currency0={farmingPool.token0} currency1={farmingPool.token1} size={20} />
            <Link
              to={`/elastic/add/${
                farmingPool.token0.isNative ? farmingPool.token0.symbol : farmingPool.token0.address
              }/${farmingPool.token1.isNative ? farmingPool.token1.symbol : farmingPool.token1.address}/${
                farmingPool.pool.fee
              }`}
            >
              <Text fontSize={16} fontWeight="500">
                {farmingPool.token0.symbol} - {farmingPool.token1.symbol}
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
            <Text>Fee = {(farmingPool.pool.fee * 100) / ELASTIC_BASE_FEE_UNIT}%</Text>
            <Text color={theme.subText}>|</Text>

            <Flex alignItems="center">
              <Text>{shortenAddress(farmingPool.poolAddress, 2)}</Text>
              <CopyHelper toCopy={farmingPool.poolAddress} />
            </Flex>
          </Flex>

          <InfoRow>
            <Text color={theme.subText}>
              <Trans>Staked TVL</Trans>
            </Text>
            <Text>{formatDollarAmount(farmingPool.tvl)}</Text>
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
              <Text as="span">{(farmingPool.farmAPR + farmingPool.poolAPR).toFixed(2)}%</Text>
              <MouseoverTooltip
                width="fit-content"
                placement="top"
                text={<APRTooltipContent farmAPR={farmingPool.farmAPR} poolAPR={farmingPool.poolAPR} />}
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
            <Text>{getFormattedTimeFromSecond(farmingPool.vestingDuration, true)}</Text>
          </InfoRow>

          <InfoRow>
            <Text color={theme.subText}>
              <Trans>Ending In</Trans>
              <InfoHelper text={t`Once a farm has ended, you will continue to receive returns through LP Fees`} />
            </Text>

            <Flex flexDirection="column" alignItems="flex-end" justifyContent="center" sx={{ gap: '8px' }}>
              {farmingPool.startTime > currentTimestamp ? (
                <>
                  <Text color={theme.subText} fontSize="12px">
                    <Trans>New phase will start in</Trans>
                  </Text>
                  {getFormattedTimeFromSecond(farmingPool.startTime - currentTimestamp)}
                </>
              ) : farmingPool.endTime > currentTimestamp ? (
                <>
                  <Text color={theme.subText} fontSize="12px">
                    <Trans>Current phase will end in</Trans>
                  </Text>
                  {getFormattedTimeFromSecond(farmingPool.endTime - currentTimestamp)}
                </>
              ) : TOBE_EXTENDED_FARMING_POOLS.includes(farmingPool.poolAddress.toLowerCase()) ? (
                <Trans>To be extended soon</Trans>
              ) : (
                <Trans>ENDED</Trans>
              )}
            </Flex>
          </InfoRow>

          {targetPercent && (
            <InfoRow>
              <Text color={theme.subText} alignItems="center" display="flex" onClick={() => setShowTargetVolInfo(true)}>
                <Trans>Target Volume</Trans>
                <Info size={12} style={{ marginLeft: '4px' }} />
              </Text>

              <Flex justifyContent="flex-end" flexDirection="column">
                {targetPercent && <FeeTarget percent={targetPercent} />}
              </Flex>
            </InfoRow>
          )}
          <InfoRow>
            <Text color={theme.subText}>
              <Trans>My Deposit</Trans>
            </Text>

            <Flex justifyContent="flex-end" color={amountCanStaked ? theme.warning : theme.text}>
              {!!farmingPool.depositedUsd ? formatDollarAmount(farmingPool.depositedUsd) : '--'}
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
              {rewardPendings.map((amount, i) => (
                <Flex alignItems="center" sx={{ gap: '4px' }} key={amount.currency.symbol || i}>
                  <HoverInlineText text={amount.toSignificant(6)} maxCharacters={10}></HoverInlineText>
                  <MouseoverTooltip placement="top" text={amount.currency.symbol} width="fit-content">
                    <CurrencyLogo currency={amount.currency} size="16px" />
                  </MouseoverTooltip>
                </Flex>
              ))}
            </Flex>

            <ActionButton
              style={{ width: '100%' }}
              colorScheme={canHarvest ? ButtonColorScheme.Green : ButtonColorScheme.Gray}
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
              onClick={() => onOpenModal('unstake', Number(farmingPool.pid))}
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
        <MinimalActionButton onClick={() => onOpenModal('stake', Number(farmingPool.pid))}>
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
        <MinimalActionButton
          colorScheme={ButtonColorScheme.Red}
          onClick={() => onOpenModal('unstake', Number(farmingPool.pid))}
        >
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
          <DoubleCurrencyLogo currency0={farmingPool.token0} currency1={farmingPool.token1} />
          <Link
            to={`/elastic/add/${farmingPool.token0.isNative ? farmingPool.token0.symbol : farmingPool.token0.address}/${
              farmingPool.token1.isNative ? farmingPool.token1.symbol : farmingPool.token1.address
            }/${farmingPool.pool.fee}`}
            style={{
              textDecoration: 'none',
            }}
          >
            <Text fontSize={14} fontWeight={500}>
              {farmingPool.token0.symbol} - {farmingPool.token1.symbol}
            </Text>
          </Link>

          <Flex
            onClick={() => {
              setSharePoolAddress(farmingPool.poolAddress)
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
          <Text>Fee = {(farmingPool.pool.fee * 100) / ELASTIC_BASE_FEE_UNIT}%</Text>
          <Text color={theme.subText}>|</Text>

          <Flex alignItems="center">
            <Text>{shortenAddress(farmingPool.poolAddress, 2)}</Text>
            <CopyHelper toCopy={farmingPool.poolAddress} />
          </Flex>
        </Flex>
      </div>

      <Text textAlign="left">{formatDollarAmount(farmingPool.tvl)}</Text>
      <Flex
        alignItems="center"
        justifyContent="flex-start"
        color={theme.apr}
        sx={{
          gap: '4px',
        }}
      >
        {(farmingPool.farmAPR + farmingPool.poolAPR).toFixed(2)}%
        <MouseoverTooltip
          width="fit-content"
          placement="right"
          text={<APRTooltipContent farmAPR={farmingPool.farmAPR} poolAPR={farmingPool.poolAPR} />}
        >
          <MoneyBag size={16} color={theme.apr} />
        </MouseoverTooltip>
      </Flex>

      <Flex flexDirection="column" alignItems="flex-start" justifyContent="center" sx={{ gap: '8px' }}>
        {farmingPool.startTime > currentTimestamp ? (
          <>
            <Text color={theme.subText} fontSize="12px">
              <Trans>New phase will start in</Trans>
            </Text>
            {getFormattedTimeFromSecond(farmingPool.startTime - currentTimestamp)}
          </>
        ) : farmingPool.endTime > currentTimestamp ? (
          <>
            <Text color={theme.subText} fontSize="12px">
              <Trans>Current phase will end in</Trans>
            </Text>
            {getFormattedTimeFromSecond(farmingPool.endTime - currentTimestamp)}
          </>
        ) : TOBE_EXTENDED_FARMING_POOLS.includes(farmingPool.poolAddress.toLowerCase()) ? (
          <Trans>To be extended soon</Trans>
        ) : (
          <Trans>ENDED</Trans>
        )}
      </Flex>

      <div>
        {amountCanStaked ? (
          <Flex justifyContent="flex-start" color={theme.warning}>
            {formatDollarAmount(farmingPool.depositedUsd)}
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
                      You still have {formatDollarAmount(amountCanStaked)} in liquidity to stake to earn even more
                      farming rewards
                    </Trans>
                  </Text>
                  <Text as="span" color={theme.text}>
                    Staked: {formatDollarAmount(farmingPool.stakedUsd)}
                  </Text>
                  <Text as="span" color={theme.warning}>
                    Not staked: {formatDollarAmount(amountCanStaked)}
                  </Text>
                </Flex>
              }
            />
          </Flex>
        ) : (
          <Flex justifyContent="flex-start" color={theme.text}>
            {farmingPool.depositedUsd ? formatDollarAmount(farmingPool.depositedUsd) : '--'}
          </Flex>
        )}

        {targetPercent && <FeeTarget percent={targetPercent} />}
      </div>

      <Flex flexDirection="column" alignItems="flex-end" sx={{ gap: '8px' }}>
        {rewardPendings.map((amount, i) => (
          <Flex alignItems="center" sx={{ gap: '4px' }} key={amount.currency.symbol || i}>
            <HoverInlineText text={amount.toSignificant(6)} maxCharacters={10}></HoverInlineText>
            <MouseoverTooltip placement="top" text={amount.currency.symbol} width="fit-content">
              <CurrencyLogo currency={amount.currency} size="16px" />
            </MouseoverTooltip>
          </Flex>
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
