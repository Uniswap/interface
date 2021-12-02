import React, { useState } from 'react'
import { Trans } from '@lingui/macro'
import { ChevronDown, ChevronUp } from 'react-feather'
import { Flex } from 'rebass'

import { ButtonPrimary } from 'components/Button'
import { RowBetween } from 'components/Row'
import useTheme from 'hooks/useTheme'
import { Reward } from 'state/farms/types'
import { TYPE } from 'theme'
import { formattedNum } from 'utils'
import { useFarmRewardsUSD } from 'utils/dmm'
import { fixedFormatting } from 'utils/formatBalance'
import { MenuFlyout, Tag } from './styleds'

const UnlockedBlock = ({ info, onClaimAll }: { info: any; onClaimAll?: () => void }) => {
  const theme = useTheme()
  const [open, setOpen] = useState<boolean>(false)

  const unlockedUSD = useFarmRewardsUSD(
    Object.keys(info).map(k => {
      return { token: info[k].token, amount: info[k].vestableAmount } as Reward
    })
  )

  return (
    <Flex width="fit-content" backgroundColor={theme.bg12} style={{ borderRadius: '4px' }}>
      <Tag>
        <RowBetween style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setOpen(prev => !prev)}>
          <TYPE.body color={theme.text11} fontWeight={'normal'} fontSize={14}>
            <Trans>Unlocked</Trans>:
          </TYPE.body>

          <Flex alignItems="center" marginLeft="4px">
            <TYPE.body color={theme.text11} fontWeight={'normal'} fontSize={14} width="max-content">
              {formattedNum(unlockedUSD.toString(), true)}
            </TYPE.body>
            {unlockedUSD > 0 && (
              <>
                {open ? (
                  <ChevronUp size="14" color={theme.text} style={{ margin: '0.15rem 0 0 0.25rem' }} />
                ) : (
                  <ChevronDown size="14" color={theme.text} style={{ margin: '0.15rem 0 0 0.25rem' }} />
                )}
              </>
            )}
          </Flex>

          {open && (
            <MenuFlyout>
              {Object.keys(info).map(k => (
                <TYPE.body color={theme.text11} fontWeight={'normal'} fontSize={18} key={k}>
                  {fixedFormatting(info[k].vestableAmount, 18)} {k}
                </TYPE.body>
              ))}
            </MenuFlyout>
          )}
        </RowBetween>
      </Tag>

      {Object.keys(info).length > 0 && unlockedUSD > 0 && (
        <ButtonPrimary height="30px" borderRadius="4px" onClick={onClaimAll} width="max-content">
          <Trans>Claim All</Trans>
        </ButtonPrimary>
      )}
    </Flex>
  )
}

export default UnlockedBlock
