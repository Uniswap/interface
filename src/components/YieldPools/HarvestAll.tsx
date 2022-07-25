import React, { useState, useRef } from 'react'
import { Trans } from '@lingui/macro'
import { Flex } from 'rebass'
import { BigNumber } from '@ethersproject/bignumber'

import { ButtonPrimary, ButtonEmpty } from 'components/Button'
import useTheme from 'hooks/useTheme'
import { Reward } from 'state/farms/types'
import { useFarmRewardsUSD } from 'utils/dmm'
import { fixedFormatting, getFullDisplayBalance } from 'utils/formatBalance'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import Harvest from 'components/Icons/Harvest'
import { Text } from 'rebass'
import HoverDropdown from 'components/HoverDropdown'
import { formatDollarAmount } from 'utils/numbers'
import CurrencyLogo from 'components/CurrencyLogo'
import { useMedia } from 'react-use'
import Modal from 'components/Modal'
import { ModalContentWrapper } from './ProMMFarmModals/styled'
import { X } from 'react-feather'
import { formattedNum } from 'utils'
import { RewardBalanceWrapper } from './styleds'
import { useActiveWeb3React } from 'hooks'

const HarvestAll = ({ totalRewards, onHarvestAll }: { totalRewards: Reward[]; onHarvestAll?: () => void }) => {
  const theme = useTheme()
  const ref = useRef<HTMLDivElement>()
  const [open, setOpen] = useState<boolean>(false)
  const totalRewardsUSD = useFarmRewardsUSD(totalRewards)

  const { chainId } = useActiveWeb3React()
  const canHarvestAll = totalRewards.some(reward => reward?.amount.gt(BigNumber.from('0')))

  const toggleRewardDetail = () => {
    if (canHarvestAll) {
      setOpen(prev => !prev)
    }
  }
  useOnClickOutside(ref, open ? toggleRewardDetail : undefined)

  const upToSmall = useMedia('(max-width: 768px)')

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
                <React.Fragment key={reward.token.wrapped.address}>
                  <Flex alignItems="center" fontSize="12px" sx={{ gap: '4px' }}>
                    {chainId && reward.token.wrapped.address && <CurrencyLogo currency={reward.token} size="16px" />}
                    {getFullDisplayBalance(reward.amount, reward.token.decimals)}
                  </Flex>
                  {index !== totalRewards.length - 1 && <Text color={theme.subText}>|</Text>}
                </React.Fragment>
              )
            })}
          </RewardBalanceWrapper>

          <ButtonPrimary
            margin="8px 0 0"
            onClick={() => {
              onHarvestAll && onHarvestAll()
              setShow(false)
            }}
          >
            Harvest
          </ButtonPrimary>
        </ModalContentWrapper>
      </Modal>

      <Flex
        alignItems="center"
        sx={{ gap: '24px' }}
        justifyContent={!upToSmall ? 'flex-start' : 'space-between'}
        width={!upToSmall ? undefined : '100%'}
      >
        <div>
          <Text fontSize="12px" color={theme.subText} width="max-content">
            <Trans>My Total Rewards</Trans>
          </Text>

          <HoverDropdown
            padding="4px 0"
            content={formatDollarAmount(totalRewardsUSD)}
            dropdownContent={
              totalRewards.some(reward => reward?.amount?.gt(0))
                ? totalRewards.map((reward, index) => {
                    if (!reward || !reward.amount || reward.amount.lte(0)) {
                      return null
                    }

                    return (
                      <Flex alignItems="center" key={reward.token.address} marginTop={index === 0 ? 0 : '8px'}>
                        <CurrencyLogo currency={reward.token} size="16px" />
                        <Text marginLeft="4px" fontSize="12px">
                          {fixedFormatting(reward.amount, reward.token.decimals)} {reward.token.symbol}
                        </Text>
                      </Flex>
                    )
                  })
                : ''
            }
          />
        </div>

        <ButtonPrimary
          width="fit-content"
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
      </Flex>
    </>
  )
}

export default HarvestAll
