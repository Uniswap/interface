import React, { useState, useCallback, useEffect, useMemo } from 'react'
import Modal from 'components/Modal'
import { Flex, Text } from 'rebass'
import { Trans } from '@lingui/macro'
import { ButtonEmpty, ButtonPrimary } from 'components/Button'
import { X } from 'react-feather'
import useTheme from 'hooks/useTheme'
import { useProMMFarms, useFarmAction } from 'state/farms/promm/hooks'
import { useToken } from 'hooks/Tokens'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import { BigNumber } from 'ethers'
import { ModalContentWrapper, Title } from './styled'
import styled from 'styled-components'
import { StyledInternalLink } from 'theme'
import { CurrencyAmount } from '@kyberswap/ks-sdk-core'
import HoverInlineText from 'components/HoverInlineText'
import CurrencyLogo from 'components/CurrencyLogo'
import { MouseoverTooltip } from 'components/Tooltip'
import { useTokensPrice } from 'state/application/hooks'
import { formatDollarAmount } from 'utils/numbers'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import { VERSION } from 'constants/v2'
const HarvestInfo = styled.div`
  padding: 16px;
  border-radius: 4px;
  background: ${({ theme }) => theme.primary + '33'};
  margin-top: 18px;
  font-size: 12px;
  line-height: 20px;
`

const RewardRow = styled.div`
  border-radius: 4px;
  padding: 8px;
  background: ${({ theme }) => theme.buttonBlack};
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-top: 20px;
  margin-bottom: 24px;
`

function HarvestModal({
  farmsAddress,
  poolId,
  onDismiss,
}: {
  farmsAddress: string
  // Null mean harvest all
  poolId: number | null
  onDismiss: () => void
}) {
  const theme = useTheme()
  const { data: farms } = useProMMFarms()
  const selectedFarm = farms[farmsAddress]

  const { harvest } = useFarmAction(farmsAddress)
  const selectedPool = poolId !== null ? selectedFarm[poolId] : undefined
  const token0 = useToken(selectedPool?.token0)
  const token1 = useToken(selectedPool?.token1)

  const [usdByToken, setUsdValueByToken] = useState<{ [address: string]: number }>({})
  const { mixpanelHandler } = useMixpanel()
  const aggreateRewardUsdValue = useCallback(({ address, value }) => {
    setUsdValueByToken(prev => {
      const tmp = { ...prev }
      if (tmp[address]) tmp[address] = tmp[address] + value
      else tmp[address] = value

      return tmp
    })
  }, [])

  const rewards: { [address: string]: BigNumber } = {}

  if (poolId === null) {
    selectedFarm.forEach(farm => {
      farm.userDepositedNFTs.forEach(pos => {
        pos.rewardPendings.forEach((amount, index) => {
          const token = farm.rewardTokens[index]
          if (rewards[token]) rewards[token] = rewards[token].add(BigNumber.from(amount))
          else rewards[token] = amount
        })
      })
    })
  } else {
    selectedPool?.userDepositedNFTs.forEach(pos => {
      pos.rewardPendings.forEach((amount, index) => {
        const token = selectedPool.rewardTokens[index]
        if (rewards[token]) rewards[token] = rewards[token].add(BigNumber.from(amount))
        else rewards[token] = amount
      })
    })
  }

  const handleHarvest = async () => {
    const nftIds: BigNumber[] = []
    const poolIds: BigNumber[] = []

    if (poolId === null)
      selectedFarm.forEach(farm => {
        farm.userDepositedNFTs
          .filter(pos => pos.stakedLiquidity.gt(0))
          .forEach(pos => {
            nftIds.push(BigNumber.from(pos.tokenId))
            poolIds.push(BigNumber.from(farm.pid))
          })
      })
    else
      selectedPool?.userDepositedNFTs
        .filter(pos => pos.stakedLiquidity.gt(0))
        .forEach(pos => {
          nftIds.push(BigNumber.from(pos.tokenId))
          poolIds.push(BigNumber.from(poolId))
        })

    const tx = await harvest(nftIds, poolIds)
    if (tx) {
      onDismiss()
      if (poolId === null) {
        mixpanelHandler(MIXPANEL_TYPE.ELASTIC_ALLS_REWARD_HARVESTED)
      } else {
        mixpanelHandler(MIXPANEL_TYPE.ELASTIC_INDIVIDUAL_REWARD_HARVESTED)
      }
    }
  }

  const addresses = Object.keys(rewards).filter(rw => rewards[rw].gt(BigNumber.from(0)))

  const usd = Object.keys(usdByToken).reduce((acc, cur) => acc + usdByToken[cur], 0)

  return (
    <Modal isOpen={!!selectedFarm} onDismiss={onDismiss} maxHeight={80} maxWidth="392px">
      <ModalContentWrapper>
        <Flex alignItems="center" justifyContent="space-between">
          <Title>
            {poolId === null ? (
              <Trans>Harvest All</Trans>
            ) : (
              <Flex>
                <DoubleCurrencyLogo size={24} currency0={token0} currency1={token1} />{' '}
                <Text>
                  <Trans>Harvest</Trans>
                </Text>
              </Flex>
            )}
          </Title>

          <Flex sx={{ gap: '12px' }}>
            <ButtonEmpty onClick={onDismiss} width="36px" height="36px" padding="0">
              <X color={theme.text} />
            </ButtonEmpty>
          </Flex>
        </Flex>

        <HarvestInfo>
          <Trans>
            After harvesting, your rewards will begin vesting linearly (only if the farm has a vesting duration).
            <br />
            <br />
            Vesting means that your reward tokens will be locked initially but released gradually. You can claim the
            reward tokens to your wallet as and when they are released.
            <br />
            <br />
            To claim your rewards, go to the{' '}
            <StyledInternalLink to="/farms?tab=vesting&farmType=elastic"> Vesting</StyledInternalLink> tab and click
            'Claim'.
          </Trans>
        </HarvestInfo>

        <Flex marginTop="20px" justifyContent="space-between">
          <Text>
            <Trans>My Rewards</Trans>
          </Text>
          <Text>{formatDollarAmount(usd)}</Text>
        </Flex>

        <RewardRow>
          {addresses.map((rw, index) => (
            <>
              <Reward key={rw} token={rw} amount={rewards[rw]} onAggreateUsdValue={aggreateRewardUsdValue} />
              {index !== addresses.length - 1 && <Text color={theme.subText}>|</Text>}
            </>
          ))}
        </RewardRow>

        <ButtonPrimary onClick={handleHarvest}>
          {poolId === null ? <Trans>Harvest All</Trans> : <Trans>Harvest</Trans>}
        </ButtonPrimary>
      </ModalContentWrapper>
    </Modal>
  )
}

const Reward = ({
  token: address,
  amount,
  onAggreateUsdValue,
}: {
  token: string
  amount?: BigNumber
  onAggreateUsdValue: (input: { address: string; value: number }) => void
}) => {
  const token = useToken(address)

  const price = useTokensPrice([token], VERSION.ELASTIC)

  const amountString = amount?.toString()

  const tokenAmout = useMemo(() => {
    return token && CurrencyAmount.fromRawAmount(token, amountString || '0')
  }, [amountString, token])

  useEffect(() => {
    if (price[0] && tokenAmout) {
      onAggreateUsdValue({ address, value: price[0] * parseFloat(tokenAmout?.toExact()) })
    }
  }, [tokenAmout, price, address, onAggreateUsdValue])

  return (
    <Flex alignItems="center" sx={{ gap: '4px' }}>
      <HoverInlineText text={tokenAmout?.toSignificant(6) || '0'} maxCharacters={10}></HoverInlineText>
      <MouseoverTooltip placement="top" text={token?.symbol} width="fit-content">
        <CurrencyLogo currency={token} size="16px" />
      </MouseoverTooltip>
    </Flex>
  )
}

export default HarvestModal
