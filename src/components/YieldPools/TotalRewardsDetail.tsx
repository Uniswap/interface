import React, { useState, useRef } from 'react'
import { ChevronDown, ChevronUp } from 'react-feather'

import useTheme from 'hooks/useTheme'
import { Reward } from 'state/farms/types'
import { TYPE } from 'theme'
import { fixedFormatting } from 'utils/formatBalance'
import { TotalRewardsDetailWrapper, MenuFlyout } from './styleds'
import { useOnClickOutside } from 'hooks/useOnClickOutside'

const TotalRewardsDetail = ({ totalRewards }: { totalRewards: Reward[] }) => {
  const theme = useTheme()
  const ref = useRef<HTMLDivElement>()
  const [open, setOpen] = useState(false)
  useOnClickOutside(ref, open ? () => setOpen(prev => !prev) : undefined)

  return (
    <TotalRewardsDetailWrapper role="button" onClick={() => setOpen(prev => !prev)} ref={ref as any}>
      <TYPE.body
        color={theme.primary1}
        fontWeight={'500'}
        fontSize={16}
        style={{ margin: '0.25rem 0.25rem 0.25rem 1rem' }}
      >
        Details
      </TYPE.body>

      {open ? (
        <ChevronUp size="16" color={theme.primary1} style={{ marginTop: '0.25rem' }} />
      ) : (
        <ChevronDown size="16" color={theme.primary1} style={{ marginTop: '0.25rem' }} />
      )}

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
