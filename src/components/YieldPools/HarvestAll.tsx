import React, { useState } from 'react'
import { Trans } from '@lingui/macro'
import { ChevronDown, ChevronUp } from 'react-feather'
import { Flex } from 'rebass'
import { BigNumber } from '@ethersproject/bignumber'

import { ButtonPrimary } from 'components/Button'
import { AutoRow, RowBetween } from 'components/Row'
import useTheme from 'hooks/useTheme'
import { Reward } from 'state/farms/types'
import { TYPE } from 'theme'
import { formattedNum } from 'utils'
import { useFarmRewardsUSD } from 'utils/dmm'
import { fixedFormatting } from 'utils/formatBalance'
import { MenuFlyout, Tag } from './styleds'

const HarvestAll = ({ totalRewards, onHarvestAll }: { totalRewards: Reward[]; onHarvestAll?: () => void }) => {
  const theme = useTheme()
  const [open, setOpen] = useState<boolean>(false)
  const totalRewardsUSD = useFarmRewardsUSD(totalRewards)

  const canHarvestAll = (rewards: Reward[]): boolean => {
    return rewards.some(reward => reward?.amount.gt(BigNumber.from('0')))
  }

  return (
    <AutoRow width="fit-content">
      <Tag>
        <RowBetween style={{ position: 'relative' }}>
          <TYPE.body color={theme.text11} fontWeight={'normal'} fontSize={14}>
            <Trans>Rewards</Trans>:
          </TYPE.body>

          <Flex alignItems="center" marginLeft="4px">
            <TYPE.body color={theme.text11} fontWeight={'normal'} fontSize={14}>
              {formattedNum(totalRewardsUSD.toString(), true)}
            </TYPE.body>
            {canHarvestAll(totalRewards) && (
              <span onClick={() => setOpen(!open)}>
                {open ? (
                  <ChevronUp size="14" color={theme.text1} style={{ margin: '0.15rem 0 0 0.25rem' }} />
                ) : (
                  <ChevronDown size="14" color={theme.text1} style={{ margin: '0.15rem 0 0 0.25rem' }} />
                )}
              </span>
            )}
          </Flex>

          {open && (
            <MenuFlyout>
              {totalRewards.map(reward => {
                if (!reward || !reward.amount || reward.amount.lte(0)) {
                  return null
                }

                return (
                  <TYPE.body color={theme.text11} fontWeight={'normal'} fontSize={18} key={reward.token.address}>
                    {fixedFormatting(reward.amount, 18)} {reward.token.symbol}
                  </TYPE.body>
                )
              })}
            </MenuFlyout>
          )}
        </RowBetween>
      </Tag>

      {canHarvestAll(totalRewards) && (
        <div>
          <ButtonPrimary height="30px" borderRadius="4px" onClick={onHarvestAll}>
            <Trans>Harvest All</Trans>
          </ButtonPrimary>
        </div>
      )}
    </AutoRow>
  )
}

export default HarvestAll
