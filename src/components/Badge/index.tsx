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
  onIconClick?: (event: MouseEvent) => void
}

const Badge = ({ icon: FeatherIcon, label, onIconClick }: BadgeProps) => {
  return ( 
    <Root alignItems="center">
      {label && (
        <Box>
          <TYPE.purple3 fontWeight="600" fontSize="8px">
            {label}
          </TYPE.purple3>
        </Box>
      )}
      {FeatherIcon && (
        <Flex ml="4px" onClick={onIconClick} alignItems="center">
          <IconBox>
            <TYPE.purple3>
              <FeatherIcon size="12px" />
            </TYPE.purple3>
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
