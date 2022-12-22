import { Trans } from '@lingui/macro'
import { useLocation } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex } from 'rebass'

import { NewLabel } from 'components/Menu'
import { TutorialIds } from 'components/Tutorial/TutorialSwap/constant'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'

import { DropdownTextAnchor, StyledNavLink } from '../styleds'
import NavGroup from './NavGroup'

const EarnNavGroup = () => {
  const { isEVM } = useActiveWeb3React()
  const upTo420 = useMedia('(max-width: 420px)')
  const { pathname } = useLocation()
  const { mixpanelHandler } = useMixpanel()
  const isActive = [APP_PATHS.POOLS, APP_PATHS.FARMS, APP_PATHS.MY_POOLS].some(path => pathname.includes(path))

  if (!isEVM) {
    return null
  }

  return (
    <NavGroup
      dropdownAlign={upTo420 ? 'right' : 'left'}
      id={TutorialIds.EARNING_LINKS}
      isActive={isActive}
      anchor={
        <DropdownTextAnchor>
          <Trans>Earn</Trans>
        </DropdownTextAnchor>
      }
      dropdownContent={
        <Flex
          sx={{
            flexDirection: 'column',
          }}
        >
          <StyledNavLink id="pools-nav-link" to={APP_PATHS.POOLS} style={{ width: '100%' }}>
            <Trans>Pools</Trans>
          </StyledNavLink>

          <StyledNavLink id="my-pools-nav-link" to={APP_PATHS.MY_POOLS}>
            <Trans>My Pools</Trans>
          </StyledNavLink>

          <StyledNavLink
            onClick={() => {
              mixpanelHandler(MIXPANEL_TYPE.FARM_UNDER_EARN_TAB_CLICK)
            }}
            id="farms-nav-link"
            to={APP_PATHS.FARMS}
          >
            <Trans>Farms</Trans>
            <NewLabel>
              <Trans>New</Trans>
            </NewLabel>
          </StyledNavLink>
        </Flex>
      }
    />
  )
}

export default EarnNavGroup
