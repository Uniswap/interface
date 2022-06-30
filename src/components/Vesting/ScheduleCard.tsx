import React from 'react'
import { Schedule } from 'state/vesting/hooks'
import styled from 'styled-components'
import { Text, Flex } from 'rebass'
import { Trans, t } from '@lingui/macro'
import useTheme from 'hooks/useTheme'
import { ButtonLight } from 'components/Button'
import dayjs from 'dayjs'
import { BigNumber } from 'ethers'
import { Token, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import CurrencyLogo from 'components/CurrencyLogo'
import HoverInlineText from 'components/HoverInlineText'
import Divider from 'components/Divider'
import { calculateGasMargin } from 'utils'
import { useTransactionAdder } from 'state/transactions/hooks'
import { formatDollarAmount } from 'utils/numbers'
import { ChevronDown } from 'react-feather'
import HoverDropdown from 'components/HoverDropdown'
import { ZERO_ADDRESS } from 'constants/index'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import { fixedFormatting } from 'utils/formatBalance'

const ScheduleCardWrapper = styled.div`
  padding: 20px 24px;
  border-radius: 8px;
  background: ${({ theme }) => theme.background};

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 20px 16px;
  `}
`

const ProgressBar = styled.div`
  border-radius: 999px;
  height: 12px;
  margin-top: 8px;
  background: ${({ theme }) => theme.buttonGray};
  position: relative;
`
const Claimed = styled.div<{ width: string }>`
  border-radius: 999px;
  height: 12px;
  background: ${({ theme }) => theme.primary};
  width: ${({ width }) => width};
  position: absolute;
  left: 0;
  top: 0;
  z-index: 1;
`

const Unlocked = styled(Claimed)`
  background: ${({ theme }) => theme.text};
`

const Dot = styled.div<{ color: string }>`
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: ${({ color }) => color};
`

const RewardBackground = styled.div`
  padding: 12px;
  border-radius: 8px;
  background: ${({ theme }) => theme.buttonBlack};
  margin-top: 8px;
`

const InfoCard = styled.div`
  margin-top: 20px;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 8px;
  padding: 12px;
`

const formatRemainTime = (numberOfSeconds: number) => {
  if (numberOfSeconds < 0) return t`Full unlocked`
  const days = numberOfSeconds / 60 / 60 / 24
  if (days > 1) return days + ' Days left'

  const hours = numberOfSeconds / 60 / 60
  if (hours < 24 && hours > 1) return hours.toFixed(0) + ' Hours left'
  const minutes = numberOfSeconds / 60
  return minutes.toFixed(0) + ' Minutes left'
}

const ScheduleCard = ({ schedules }: { schedules: Schedule[] }) => {
  const theme = useTheme()
  const endTime = schedules.reduce((max, schedule) => (max < schedule.endTime ? schedule.endTime : max), 0)
  const currentTimestamp = Math.floor(+new Date() / 1000)
  const remainTime = endTime - currentTimestamp
  const { mixpanelHandler } = useMixpanel()

  const info = schedules.reduce<{
    [tokenAddress: string]: {
      vestableIndexes: number[]
      vestableAmount: BigNumber
      /* fullyIndexes: number[] */
      /* fullyAmount: BigNumber */
      totalAmount: BigNumber
      unlockedAmount: BigNumber
      vestedAmount: BigNumber
      token: Token
      tokenPrice: number
    }
  }>((result, schedule, index) => {
    const address = (schedule.token.isNative ? ZERO_ADDRESS : schedule.token.address) as string

    if (!result[address]) {
      result[address] = {
        vestableIndexes: [],
        vestableAmount: BigNumber.from(0),
        /* fullyIndexes: [], */
        /* fullyAmount: BigNumber.from(0), */
        totalAmount: BigNumber.from(0),
        unlockedAmount: BigNumber.from(0),
        vestedAmount: BigNumber.from(0),
        token: schedule.token,
        tokenPrice: schedule.tokenPrice,
      }
    }

    result[address].totalAmount = result[address].totalAmount.add(BigNumber.from(schedule.quantity))
    result[address].vestedAmount = result[address].vestedAmount.add(BigNumber.from(schedule.vestedQuantity))
    /**
     * fullyVestedAlready = schedule.quantity - schedule.vestedQuantity
     */
    const fullyVestedAlready = schedule.quantity.sub(schedule.vestedQuantity).isZero()
    const isEnd = currentTimestamp > schedule.endTime

    const timePeriod = BigNumber.from(schedule.endTime - schedule.startTime)

    const unlockedAmount = isEnd
      ? schedule.quantity
      : schedule.quantity.mul(BigNumber.from(currentTimestamp).sub(BigNumber.from(schedule.startTime))).div(timePeriod)

    result[address].unlockedAmount = result[address].unlockedAmount.add(unlockedAmount)
    const vestableAmount = unlockedAmount.sub(BigNumber.from(schedule.vestedQuantity)) // vestableAmount = unlock - vestedQuanitty

    result[address].vestableAmount = result[address].vestableAmount.add(
      vestableAmount.isNegative() ? BigNumber.from(0) : vestableAmount,
    )

    if (!fullyVestedAlready) {
      result[address].vestableIndexes.push(schedule.index)
    }

    /* if (!fullyVestedAlready && isEnd) { */
    /*   result[address].fullyIndexes.push(schedule.index) */
    /*   result[address].fullyAmount = result[address].fullyAmount.add(schedule.quantity) */
    /* } */

    return result
  }, {})

  const unlockedUSD = Object.values(info).reduce((res, item) => {
    const vestableAmount = CurrencyAmount.fromRawAmount(item.token, item.vestableAmount.toString())
    return res + item.tokenPrice * parseFloat(vestableAmount.toExact())
  }, 0)

  const harvestedUSD = Object.values(info).reduce((res, item) => {
    const harvestedAmount = CurrencyAmount.fromRawAmount(item.token, item.totalAmount.toString())
    return res + item.tokenPrice * parseFloat(harvestedAmount.toExact())
  }, 0)

  const claimedUSD = Object.values(info).reduce((res, item) => {
    const vestedAmount = CurrencyAmount.fromRawAmount(item.token, item.vestedAmount.toString())
    return res + item.tokenPrice * parseFloat(vestedAmount.toExact())
  }, 0)
  const addTransactionWithType = useTransactionAdder()
  const handleClaimAll = async () => {
    const contract = schedules?.[0].contract
    if (!contract) return
    let tokens = Object.keys(info)
    let indices = tokens.map(key => info[key].vestableIndexes)

    tokens = tokens.filter((_token, index) => !!indices[index].length)
    indices = indices.filter(ind => !!ind.length)

    const estimateGas = await contract.estimateGas.vestScheduleForMultipleTokensAtIndices(tokens, indices)
    const tx = await contract.vestScheduleForMultipleTokensAtIndices(tokens, indices, {
      gasLimit: calculateGasMargin(estimateGas),
    })
    if (tx) {
      addTransactionWithType(tx, { type: 'Claim', summary: 'all rewards' })
      mixpanelHandler(MIXPANEL_TYPE.ELASTIC_ALL_REWARD_CLAIMED, {
        reward_tokens_and_qty: Object.assign(
          {},
          ...Object.keys(info).map(k => {
            return { [k]: fixedFormatting(info[k].vestableAmount, info[k].token.decimals) }
          }),
        ),
      })
    }
  }

  const claimable = Object.values(info).some(item => item.vestableAmount.gt(0))

  const claimedPercent = (harvestedUSD ? claimedUSD / harvestedUSD : 0) * 100
  const unlockedPercent = (harvestedUSD ? unlockedUSD / harvestedUSD : 0) * 100

  return (
    <ScheduleCardWrapper>
      <Text fontWeight="500" fontSize={20}>
        GROUP
      </Text>

      <Flex fontSize={12} marginTop="1rem" justifyContent="space-between">
        <Text color={theme.subText}>
          <Trans>Full unlock</Trans>{' '}
        </Text>
        <Text>
          {dayjs(endTime * 1000).format('DD-MM-YYYY')} ({formatRemainTime(remainTime)})
        </Text>
      </Flex>

      <ProgressBar>
        <Unlocked width={`${claimedPercent + unlockedPercent}%`} />
        <Claimed width={claimedPercent + '%'} />
      </ProgressBar>

      <Flex alignItems="center" justifyContent="space-between" fontSize="12px" color={theme.subText} marginTop="12px">
        <Flex>
          <Dot color={theme.primary} />
          <Text marginLeft="4px" lineHeight="16px">
            <Trans>{claimedPercent.toFixed(0)}% Claimed</Trans>
          </Text>
        </Flex>
        <Flex>
          <Dot color={theme.text} />
          <Text marginLeft="4px" lineHeight="16px">
            <Trans>{unlockedPercent.toFixed(0)}% Unlocked</Trans>
          </Text>
        </Flex>
        <Flex>
          <Dot color={theme.buttonGray} />
          <Text marginLeft="4px" lineHeight="16px">
            <Trans>{Math.abs(100 - unlockedPercent - claimedPercent).toFixed(0)}% Locked</Trans>
          </Text>
        </Flex>
      </Flex>

      <Flex marginTop="20px" alignItems="center" justifyContent="space-between">
        <Text color={theme.subText} fontSize="12px">
          <Trans>Unlocked Rewards</Trans>
        </Text>
        <Text fontSize="14px">{formatDollarAmount(unlockedUSD)}</Text>
      </Flex>

      <RewardBackground>
        <Flex sx={{ gap: '12px' }} marginBottom="8px" alignItems="center" justifyContent="center">
          {Object.keys(info).map((key, index) => {
            const item = info[key]
            return (
              <React.Fragment key={key}>
                <Flex sx={{ gap: '4px' }} fontSize="12px" alignItems="center">
                  <CurrencyLogo currency={item.token} size="16px" />
                  <HoverInlineText
                    maxCharacters={10}
                    text={CurrencyAmount.fromRawAmount(item.token, item.vestableAmount.toString()).toSignificant(10)}
                  />
                </Flex>
                {index !== Object.keys(info).length - 1 && <Text color={theme.subText}>|</Text>}
              </React.Fragment>
            )
          })}
        </Flex>
        <ButtonLight style={{ height: '32px', fontSize: '14px' }} onClick={handleClaimAll} disabled={!claimable}>
          <Trans>Claim</Trans>
        </ButtonLight>
      </RewardBackground>

      <InfoCard>
        <Flex alignItems="center" justifyContent="space-between" marginBottom="4px">
          <Text color={theme.subText} fontSize={12}>
            <Trans>Total Harvested Rewards</Trans>
          </Text>
          <HoverDropdown
            hideIcon
            placement="right"
            content={
              <Flex alignItems="center" fontSize="14px">
                <Text>{formatDollarAmount(harvestedUSD)}</Text>
                <ChevronDown size={16} />
              </Flex>
            }
            dropdownContent={
              Object.values(info).length
                ? Object.values(info).map(amount => (
                    <Flex alignItems="center" key={amount.token.address} paddingY="4px">
                      <CurrencyLogo size="16px" currency={amount.token} />
                      <Text fontSize="12px" marginLeft="4px">
                        {CurrencyAmount.fromRawAmount(amount.token, amount.totalAmount.toString()).toSignificant(8)}{' '}
                        {amount.token.symbol}
                      </Text>
                    </Flex>
                  ))
                : ''
            }
          />
        </Flex>
        <Divider />
        <Flex alignItems="center" justifyContent="space-between" marginTop="4px">
          <Text color={theme.subText} fontSize={12}>
            <Trans>Claimed Rewards</Trans>
          </Text>

          <HoverDropdown
            hideIcon
            placement="right"
            content={
              <Flex alignItems="center" fontSize="14px">
                <Text>{formatDollarAmount(claimedUSD)}</Text>
                <ChevronDown size={16} />
              </Flex>
            }
            dropdownContent={
              Object.values(info).length
                ? Object.values(info).map(amount => (
                    <Flex alignItems="center" key={amount.token.address} paddingY="4px">
                      <CurrencyLogo size="16px" currency={amount.token} />
                      <Text fontSize="12px" marginLeft="4px">
                        {CurrencyAmount.fromRawAmount(amount.token, amount.vestedAmount.toString()).toSignificant(8)}{' '}
                        {amount.token.symbol}
                      </Text>
                    </Flex>
                  ))
                : ''
            }
          />
        </Flex>
      </InfoCard>
    </ScheduleCardWrapper>
  )
}

export default ScheduleCard
