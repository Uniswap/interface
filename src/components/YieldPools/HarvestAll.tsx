import React, { useState, useRef } from 'react'
import { Trans } from '@lingui/macro'
import { ChevronDown, ChevronUp } from 'react-feather'
import { Flex } from 'rebass'
import { BigNumber } from '@ethersproject/bignumber'

import { ButtonPrimary } from 'components/Button'
import { RowBetween } from 'components/Row'
import useTheme from 'hooks/useTheme'
import { Reward } from 'state/farms/types'
import { TYPE } from 'theme'
import { formattedNum } from 'utils'
import { useFarmRewardsUSD } from 'utils/dmm'
import { fixedFormatting } from 'utils/formatBalance'
import { MenuFlyout, Tag } from './styleds'
import { useOnClickOutside } from 'hooks/useOnClickOutside'

const HarvestAll = ({ totalRewards, onHarvestAll }: { totalRewards: Reward[]; onHarvestAll?: () => void }) => {
  const theme = useTheme()
  const ref = useRef<HTMLDivElement>()
  const [open, setOpen] = useState<boolean>(false)
  const totalRewardsUSD = useFarmRewardsUSD(totalRewards)

  const canHarvestAll = totalRewards.some(reward => reward?.amount.gt(BigNumber.from('0')))

  const toggleRewardDetail = () => {
    if (canHarvestAll) {
      setOpen(prev => !prev)
    }
  }
  useOnClickOutside(ref, open ? toggleRewardDetail : undefined)

  return (
    <Flex width="fit-content" backgroundColor={theme.bg11} style={{ borderRadius: '0.25rem' }}>
      <Tag ref={ref as any}>
        <RowBetween
          style={{ position: 'relative', cursor: canHarvestAll ? 'pointer' : 'unset' }}
          onClick={toggleRewardDetail}
        >
          <TYPE.body color={theme.text11} fontWeight={'normal'} fontSize={14}>
            <Trans>Rewards</Trans>:
          </TYPE.body>

          <Flex alignItems="center" marginLeft="4px">
            <TYPE.body color={theme.text11} fontWeight={'normal'} fontSize={14}>
              {formattedNum(totalRewardsUSD.toString(), true)}
            </TYPE.body>
            {canHarvestAll && (
              <>
                {open ? (
                  <ChevronUp size="14" color={theme.text1} style={{ margin: '0.15rem 0 0 0.25rem' }} />
                ) : (
                  <ChevronDown size="14" color={theme.text1} style={{ margin: '0.15rem 0 0 0.25rem' }} />
                )}
              </>
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

      <ButtonPrimary height="30px" borderRadius="4px" onClick={onHarvestAll} disabled={!canHarvestAll}>
        <Trans>Harvest All</Trans>
      </ButtonPrimary>
    </Flex>
  )
}

export default HarvestAll
