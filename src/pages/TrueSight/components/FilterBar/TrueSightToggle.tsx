import React from 'react'
import FilterBarToggle, { ToggleProps } from 'components/Toggle/FilterBarToggle'
import { Flex, Text } from 'rebass'
import { Trans, t } from '@lingui/macro'
import useTheme from 'hooks/useTheme'
import InfoHelper from 'components/InfoHelper'

const TrueSightToggle = ({ isActive, toggle }: ToggleProps) => {
  const theme = useTheme()

  return (
    <Flex alignItems="center">
      <Text fontSize="14px" color={theme.subText} fontWeight={500}>
        <Trans>TrueSight</Trans>
      </Text>
      <InfoHelper text={t`Tokens we had discovered earlier to be Trending Soon`} />
      <FilterBarToggle isActive={isActive} toggle={toggle} style={{ marginLeft: '4px' }} />
    </Flex>
  )
}

export default TrueSightToggle
