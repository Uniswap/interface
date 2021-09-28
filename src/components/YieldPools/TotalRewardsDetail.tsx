import React, { useState } from 'react'
import { ChevronDown, ChevronUp } from 'react-feather'

import useTheme from 'hooks/useTheme'
import { Reward } from 'state/farms/types'
import { TYPE } from 'theme'
import { fixedFormatting } from 'utils/formatBalance'
import { TotalRewardsDetailWrapper, MenuFlyout } from './styleds'

const TotalRewardsDetail = ({ totalRewards }: { totalRewards: Reward[] }) => {
  const theme = useTheme()
  const [open, setOpen] = useState(false)

  return (
    <TotalRewardsDetailWrapper>
      <TYPE.body
        color={theme.primary1}
        fontWeight={'500'}
        fontSize={16}
        style={{ margin: '0.25rem 0.25rem 0.25rem 1rem' }}
        onClick={() => setOpen(!open)}
      >
        Details
      </TYPE.body>

      <span onClick={() => setOpen(!open)}>
        {open ? (
          <ChevronUp size="16" color={theme.primary1} style={{ marginTop: '0.25rem' }} />
        ) : (
          <ChevronDown size="16" color={theme.primary1} style={{ marginTop: '0.25rem' }} />
        )}
      </span>

      {open && (
        <MenuFlyout>
          {totalRewards.map(reward => {
            if (!reward || !reward.amount || reward.amount.lte(0)) {
              return null
            }

            return (
              <TYPE.body key={reward.token.address} color={theme.text11} fontWeight={'normal'} fontSize={16}>
                {fixedFormatting(reward.amount, 18)} {reward.token.symbol}
              </TYPE.body>
            )
          })}
        </MenuFlyout>
      )}
    </TotalRewardsDetailWrapper>
  )
}

export default TotalRewardsDetail
