import { Trans } from '@lingui/macro'
import React, { ReactNode, useState } from 'react'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import SlippageControl from 'components/SlippageControl'
import { MouseoverTooltip, TextDashed } from 'components/Tooltip'
import { DEFAULT_SLIPPAGE, DEFAULT_SLIPPAGE_STABLE_PAIR_SWAP } from 'constants/index'
import useTheme from 'hooks/useTheme'
import { useAppSelector } from 'state/hooks'
import { useUserSlippageTolerance } from 'state/user/hooks'
import { ExternalLink } from 'theme'
import { checkWarningSlippage, formatSlippage } from 'utils/slippage'

const DropdownIcon = styled(DropdownSVG)`
  transition: transform 300ms;
  color: ${({ theme }) => theme.subText};
  &[data-flip='true'] {
    transform: rotate(180deg);
  }
`

type Props = {
  isStablePairSwap: boolean
  rightComponent?: ReactNode
}
const SlippageSetting = ({ isStablePairSwap, rightComponent }: Props) => {
  const theme = useTheme()
  const isSlippageControlPinned = useAppSelector(state => state.user.isSlippageControlPinned)
  const [expanded, setExpanded] = useState(false)
  const [rawSlippage, setRawSlippage] = useUserSlippageTolerance()
  const isWarningSlippage = checkWarningSlippage(rawSlippage, isStablePairSwap)

  if (!isSlippageControlPinned) {
    return null
  }

  return (
    <Flex
      sx={{
        flexDirection: 'column',
        width: '100%',
        padding: '0 8px',
      }}
    >
      <Flex
        sx={{
          alignItems: 'center',
          color: theme.subText,
          gap: '4px',
          justifyContent: 'space-between',
        }}
      >
        <Flex sx={{ gap: '4px' }} alignItems="center">
          <TextDashed
            color={theme.subText}
            fontSize={12}
            fontWeight={500}
            sx={{
              display: 'flex',
              alignItems: 'center',
              lineHeight: '1',
              height: 'fit-content',
            }}
          >
            <MouseoverTooltip
              placement="right"
              text={
                <Text>
                  <Trans>
                    During your swap if the price changes by more than this %, your transaction will revert. Read more{' '}
                    <ExternalLink href="https://docs.kyberswap.com/getting-started/foundational-topics/decentralized-finance/slippage">
                      here ↗
                    </ExternalLink>
                  </Trans>
                </Text>
              }
            >
              <Trans>Max Slippage</Trans>
            </MouseoverTooltip>
          </TextDashed>
          :
          <Flex
            sx={{
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
            }}
            role="button"
            onClick={() => setExpanded(e => !e)}
          >
            <Text
              sx={{
                fontSize: '14px',
                fontWeight: 500,
                lineHeight: '1',
                color: theme.text,
              }}
            >
              {formatSlippage(rawSlippage)}
            </Text>

            <DropdownIcon data-flip={expanded} />
          </Flex>
        </Flex>
        {rightComponent}
      </Flex>

      <Flex
        sx={{
          transition: 'all 100ms linear',
          paddingTop: expanded ? '8px' : '0px',
          height: expanded ? '36px' : '0px',
          overflow: 'hidden',
        }}
      >
        <SlippageControl
          rawSlippage={rawSlippage}
          setRawSlippage={setRawSlippage}
          isWarning={isWarningSlippage}
          defaultRawSlippage={isStablePairSwap ? DEFAULT_SLIPPAGE_STABLE_PAIR_SWAP : DEFAULT_SLIPPAGE}
        />
      </Flex>
    </Flex>
  )
}

export default SlippageSetting
