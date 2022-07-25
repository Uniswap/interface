import React from 'react'
import Toggle, { ToggleProps } from 'components/Toggle'
import { Flex } from 'rebass'
import { t, Trans } from '@lingui/macro'
import useTheme from 'hooks/useTheme'
import { TextTooltip } from 'pages/TrueSight/styled'
import { MouseoverTooltip } from 'components/Tooltip'

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
