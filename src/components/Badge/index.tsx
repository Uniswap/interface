import React, { MouseEvent } from 'react'
import { Flex, Box } from 'rebass'
import styled from 'styled-components'
import { TYPE } from '../../theme'

const Root = styled(Flex)`
  height: 20px;
  text-transform: uppercase;
  background: rgba(96, 93, 130, 0.1);
  border-radius: 4px;
  padding: 0px 4px;
`

const IconBox = styled(Box)`
  cursor: pointer;
`

interface BadgeProps {
  icon?: any
  label: any
  onClick?: (event: MouseEvent) => void
}

const Badge = ({ icon: FeatherIcon, label, onClick }: BadgeProps) => {
  return (
    <Root alignItems="center" onClick={onClick}>
      {label && (
        <Box>
          <TYPE.body fontWeight="600" fontSize="8px">
            {label}
          </TYPE.body>
        </Box>
      )}
      {FeatherIcon && (
        <Flex ml="4px" alignItems="center">
          <IconBox>
            <TYPE.body>
              <FeatherIcon size="12px" />
            </TYPE.body>
          </IconBox>
        </Flex>
      )}
    </Root>
  )
}

Badge.defaultProps = {
  onIconClick: () => {}
}

export default Badge
