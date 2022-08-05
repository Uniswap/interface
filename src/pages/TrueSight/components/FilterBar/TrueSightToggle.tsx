import { Trans, t } from '@lingui/macro'
import React from 'react'
import { Flex } from 'rebass'

import Toggle, { ToggleProps } from 'components/Toggle'
import { MouseoverTooltip } from 'components/Tooltip'
import useTheme from 'hooks/useTheme'
import { TextTooltip } from 'pages/TrueSight/styled'

const TrueSightToggle = ({ isActive, toggle }: ToggleProps) => {
  const theme = useTheme()

  return (
    <Flex alignItems="center">
      <MouseoverTooltip text={t`Tokens we had discovered earlier to be Trending Soon`}>
        <TextTooltip color={theme.subText} fontSize="14px" fontWeight={500}>
          <Trans>TrueSight</Trans>
        </TextTooltip>
      </MouseoverTooltip>
      <Toggle isActive={isActive} toggle={toggle} style={{ marginLeft: '8px' }} />
    </Flex>
  )
}

export default TrueSightToggle
