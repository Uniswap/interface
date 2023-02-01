import { Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { BigNumber } from 'ethers'
import { X } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ButtonEmpty, ButtonPrimary } from 'components/Button'
import CurrencyLogo from 'components/CurrencyLogo'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import HoverInlineText from 'components/HoverInlineText'
import Modal from 'components/Modal'
import { MouseoverTooltip } from 'components/Tooltip'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import { useElasticFarms, useFarmAction } from 'state/farms/elastic/hooks'
import { useTokenPrices } from 'state/tokenPrices/hooks'
import { StyledInternalLink } from 'theme'
import { formatDollarAmount } from 'utils/numbers'

import { ModalContentWrapper, Title } from './styled'

const HarvestInfo = styled.div`
  padding: 16px;
  border-radius: 4px;
  background: ${({ theme }) => theme.primary + '33'};
  margin-top: 18px;
  font-size: 12px;
  line-height: 20px;
`

const RewardRow = styled.div`
  border-radius: 999px;
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
  const { networkInfo } = useActiveWeb3React()
  const theme = useTheme()
  const { farms, userFarmInfo } = useElasticFarms()
  const selectedFarm = farms?.find(farm => farm.id.toLowerCase() === farmsAddress.toLowerCase())

  const { harvest } = useFarmAction(farmsAddress)
  const selectedPool =
    poolId !== null ? selectedFarm?.pools.find(pool => Number(pool.pid) === Number(poolId)) : undefined

  const { mixpanelHandler } = useMixpanel()

  const rewards: { [address: string]: CurrencyAmount<Currency> } = {}

  const { rewardPendings = {}, joinedPositions = {} } = userFarmInfo?.[farmsAddress] || {}

  if (poolId === null) {
    Object.values(rewardPendings || {})
      .flat()
      .forEach(reward => {
        const token = reward.currency.wrapped.address
        if (rewards[token]) rewards[token] = rewards[token].add(reward)
        else rewards[token] = reward
      })
  } else {
    rewardPendings?.[poolId.toString()]?.forEach(reward => {
      const token = reward.currency.wrapped.address
      if (rewards[token]) rewards[token] = rewards[token].add(reward)
      else rewards[token] = reward
    })
  }

  const handleHarvest = async () => {
    const nftIds: BigNumber[] = []
    const poolIds: BigNumber[] = []

    if (poolId === null)
      Object.keys(joinedPositions).forEach(pid => {
        joinedPositions[pid].forEach(pos => {
          if (BigNumber.from(pos.liquidity.toString()).gt(BigNumber.from(0))) {
            nftIds.push(pos.nftId)
            poolIds.push(BigNumber.from(pid))
          }
        })
      })
    else
      joinedPositions[poolId.toString()]?.forEach(pos => {
        if (BigNumber.from(pos.liquidity.toString()).gt(BigNumber.from(0))) {
          nftIds.push(pos.nftId)
          poolIds.push(BigNumber.from(poolId))
        }
      })

    const tx = await harvest(nftIds, poolIds, selectedPool, Object.values(rewards))
    if (tx) {
      onDismiss()
      if (poolId === null) {
        mixpanelHandler(MIXPANEL_TYPE.ELASTIC_ALLS_REWARD_HARVESTED)
      } else {
        mixpanelHandler(MIXPANEL_TYPE.ELASTIC_INDIVIDUAL_REWARD_HARVESTED)
      }
    }
  }

  const rewardAddress = Object.keys(rewards)
  const tokenPrices = useTokenPrices(rewardAddress)
  const usdValue = Object.values(rewards).reduce((acc, cur) => {
    return acc + Number(cur.toExact()) * (tokenPrices[cur.currency.wrapped.address] || 0)
  }, 0)

  return (
    <Modal isOpen={!!selectedFarm} onDismiss={onDismiss} maxHeight={80} maxWidth="392px">
      <ModalContentWrapper>
        <Flex alignItems="center" justifyContent="space-between">
          <Title>
            {poolId === null ? (
              <Trans>Harvest All</Trans>
            ) : (
              <Flex>
                <DoubleCurrencyLogo size={24} currency0={selectedPool?.token0} currency1={selectedPool?.token1} />{' '}
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
            <StyledInternalLink to={`${APP_PATHS.FARMS}/${networkInfo.route}?type=vesting&tab=elastic`}>
              {' '}
              Vesting
            </StyledInternalLink>{' '}
            tab and click &apos;Claim&apos;.
          </Trans>
        </HarvestInfo>

        <Flex marginTop="20px" justifyContent="space-between">
          <Text>
            <Trans>My Rewards</Trans>
          </Text>
          <Text>{formatDollarAmount(usdValue)}</Text>
        </Flex>

        <RewardRow>
          {Object.values(rewards).map(reward => (
            <Flex alignItems="center" sx={{ gap: '4px' }} key={reward.currency.symbol}>
              <HoverInlineText text={reward.toSignificant(6) || '0'} maxCharacters={10}></HoverInlineText>
              <MouseoverTooltip placement="top" text={reward.currency.symbol} width="fit-content">
                <CurrencyLogo currency={reward.currency} size="16px" />
              </MouseoverTooltip>
            </Flex>
          ))}
        </RewardRow>

        <ButtonPrimary onClick={handleHarvest}>
          {poolId === null ? <Trans>Harvest All</Trans> : <Trans>Harvest</Trans>}
        </ButtonPrimary>
      </ModalContentWrapper>
    </Modal>
  )
}

export default HarvestModal
