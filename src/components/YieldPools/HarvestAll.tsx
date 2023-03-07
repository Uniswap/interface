import { BigNumber } from '@ethersproject/bignumber'
import { Trans } from '@lingui/macro'
import { Fragment, useRef, useState } from 'react'
import { X } from 'react-feather'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'

import { ButtonEmpty, ButtonPrimary } from 'components/Button'
import Column from 'components/Column'
import CurrencyLogo from 'components/CurrencyLogo'
import HoverDropdown from 'components/HoverDropdown'
import Harvest from 'components/Icons/Harvest'
import Modal from 'components/Modal'
import Row, { RowBetween, RowFit } from 'components/Row'
import { useActiveWeb3React } from 'hooks'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useTheme from 'hooks/useTheme'
import { Reward } from 'state/farms/classic/types'
import { formattedNum } from 'utils'
import { useFarmRewardsUSD } from 'utils/dmm'
import { fixedFormatting, getFullDisplayBalance } from 'utils/formatBalance'
import { formatDollarAmount } from 'utils/numbers'

import { ModalContentWrapper } from './ElasticFarmModals/styled'
import { RewardBalanceWrapper } from './styleds'

const HarvestAll = ({ totalRewards, onHarvestAll }: { totalRewards: Reward[]; onHarvestAll?: () => void }) => {
  const theme = useTheme()
  const ref = useRef<HTMLDivElement>()
  const [open, setOpen] = useState<boolean>(false)
  const totalRewardsUSD = useFarmRewardsUSD(totalRewards)
  const above500 = useMedia('(min-width:500px)')

  const { chainId } = useActiveWeb3React()
  const canHarvestAll = totalRewards.some(reward => reward?.amount.gt(BigNumber.from('0')))

  const toggleRewardDetail = () => {
    if (canHarvestAll) {
      setOpen(prev => !prev)
    }
  }
  useOnClickOutside(ref, open ? toggleRewardDetail : undefined)

  const [show, setShow] = useState(false)

  return (
    <>
      <Modal isOpen={show} onDismiss={() => setShow(false)}>
        <ModalContentWrapper>
          <Flex alignItems="center" justifyContent="space-between" marginBottom="1rem">
            <Text fontSize="20px" fontWeight="500">
              Harvest All
            </Text>
            <ButtonEmpty onClick={() => setShow(false)} width="36px" height="36px" padding="0">
              <X color={theme.text} />
            </ButtonEmpty>
          </Flex>

          <Flex justifyContent="space-between" alignItems="center" marginTop="1rem">
            <Text color={theme.subText} fontSize="0.75rem">
              <Trans>My Rewards</Trans>
            </Text>
            <Text fontSize="0.75rem" fontWeight="500">
              {formattedNum(totalRewardsUSD.toString(), true)}
            </Text>
          </Flex>

          <RewardBalanceWrapper>
            {totalRewards.map((reward, index) => {
              return (
                <Fragment key={reward.token.wrapped.address}>
                  <Flex alignItems="center" fontSize="12px" sx={{ gap: '4px' }}>
                    {chainId && reward.token.wrapped.address && <CurrencyLogo currency={reward.token} size="16px" />}
                    {getFullDisplayBalance(reward.amount, reward.token.decimals)}
                  </Flex>
                  {index !== totalRewards.length - 1 && <Text color={theme.subText}>|</Text>}
                </Fragment>
              )
            })}
          </RewardBalanceWrapper>

          <ButtonPrimary
            margin="8px 0 0"
            onClick={() => {
              onHarvestAll?.()
              setShow(false)
            }}
          >
            Harvest
          </ButtonPrimary>
        </ModalContentWrapper>
      </Modal>
      {above500 ? (
        <RowFit>
          <RowFit
            fontSize="14px"
            gap="4px"
            color={theme.subText}
            width="max-content"
            fontWeight={500}
            marginRight="8px"
          >
            <Harvest width={16} height={16} />
            <Trans>Rewards</Trans>
          </RowFit>

          <HoverDropdown
            padding="4px 0"
            content={
              <Text fontSize="20px" fontWeight={500}>
                {formatDollarAmount(totalRewardsUSD)}
              </Text>
            }
            dropdownContent={
              totalRewards.some(reward => reward?.amount?.gt(0)) ? (
                <Column gap="8px">
                  {totalRewards.map(reward => {
                    if (!reward || !reward.amount || reward.amount.lte(0)) {
                      return null
                    }

                    return (
                      <Row key={reward.token.address}>
                        <CurrencyLogo currency={reward.token} size="16px" />
                        <Text marginLeft="4px" fontSize="12px">
                          {fixedFormatting(reward.amount, reward.token.decimals)} {reward.token.symbol}
                        </Text>
                      </Row>
                    )
                  })}
                </Column>
              ) : (
                ''
              )
            }
            style={{ marginRight: '24px' }}
          />

          <ButtonPrimary
            width="160px"
            onClick={() => setShow(true)}
            disabled={!canHarvestAll}
            padding="10px 12px"
            height="fit-content"
          >
            <Harvest />
            <Text marginLeft="4px">
              <Trans>Harvest All</Trans>
            </Text>
          </ButtonPrimary>
        </RowFit>
      ) : (
        <Column
          gap="12px"
          style={{
            flex: '1',
            borderRadius: '20px',
            background: theme.buttonBlack,
            padding: '16px',
            alignItems: 'stretch',
          }}
        >
          <RowBetween>
            <RowFit
              fontSize="14px"
              gap="4px"
              color={theme.subText}
              width="max-content"
              fontWeight={500}
              marginRight="8px"
            >
              <Harvest width={16} height={16} />
              <Trans>Rewards</Trans>
            </RowFit>

            <HoverDropdown
              padding="4px 0"
              content={
                <Text fontSize="20px" fontWeight={500}>
                  {formatDollarAmount(totalRewardsUSD)}
                </Text>
              }
              dropdownContent={
                totalRewards.some(reward => reward?.amount?.gt(0)) ? (
                  <Column gap="8px">
                    {totalRewards.map(reward => {
                      if (!reward || !reward.amount || reward.amount.lte(0)) {
                        return null
                      }

                      return (
                        <Row key={reward.token.address}>
                          <CurrencyLogo currency={reward.token} size="16px" />
                          <Text marginLeft="4px" fontSize="12px">
                            {fixedFormatting(reward.amount, reward.token.decimals)} {reward.token.symbol}
                          </Text>
                        </Row>
                      )
                    })}
                  </Column>
                ) : (
                  ''
                )
              }
            />
          </RowBetween>
          <ButtonPrimary
            onClick={() => setShow(true)}
            disabled={!canHarvestAll}
            padding="10px 12px"
            height="fit-content"
          >
            <Harvest />
            <Text marginLeft="4px">
              <Trans>Harvest All</Trans>
            </Text>
          </ButtonPrimary>
        </Column>
      )}
    </>
  )
}

export default HarvestAll
