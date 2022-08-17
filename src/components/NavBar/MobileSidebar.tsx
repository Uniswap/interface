import FeatureFlagModal from 'components/FeatureFlagModal/FeatureFlagModal'
import { PrivacyPolicyModal } from 'components/PrivacyPolicy'
import { Box } from 'nft/components/Box'
import { Portal } from 'nft/components/common/Portal'
import { Column, Row } from 'nft/components/Flex'
import {
  BarChartIconMobile,
  BulletIcon,
  CloseIcon,
  DiscordIconMenuMobile,
  GithubIconMenuMobile,
  GovernanceIconMobile,
  HamburgerIcon,
  TwitterIconMenuMobile,
} from 'nft/components/icons'
import { themeVars } from 'nft/css/sprinkles.css'
import { ReactNode, useReducer } from 'react'
import { NavLink, NavLinkProps, useLocation } from 'react-router-dom'
import { useToggleModal, useTogglePrivacyPolicy } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import { isDevelopmentEnv, isStagingEnv } from 'utils/env'

import * as styles from './MobileSidebar.css'
import { NavIcon } from './NavIcon'

interface NavLinkRowProps {
  href: string
  id?: NavLinkProps['id']
  isActive?: boolean
  close: () => void
  children: ReactNode
}

const NavLinkRow = ({ href, id, isActive, close, children }: NavLinkRowProps) => {
  return (
    <NavLink to={href} className={isActive ? styles.activeLinkRow : styles.linkRow} id={id} onClick={close}>
      {children}
    </NavLink>
  )
}

const ExtraLinkRow = ({
  to,
  href,
  close,
  children,
}: {
  to?: NavLinkProps['to']
  href?: string
  close: () => void
  children: ReactNode
}) => {
  return (
    <>
      {to ? (
        <NavLink to={to} className={styles.extraLinkRow}>
          <Row gap="12" onClick={close}>
            {children}
          </Row>
        </NavLink>
      ) : (
        <Row
          as="a"
          href={href}
          target={'_blank'}
          rel={'noopener noreferrer'}
          gap="12"
          onClick={close}
          className={styles.extraLinkRow}
        >
          {children}
        </Row>
      )}
    </>
  )
}

const BottomExternalLink = ({
  href,
  onClick,
  children,
}: {
  href?: string
  onClick?: () => void
  children: ReactNode
}) => {
  return (
    <Box
      as={href ? 'a' : 'div'}
      href={href ?? undefined}
      target={href ? '_blank' : undefined}
      rel={href ? 'noopener noreferrer' : undefined}
      className={`${styles.bottomJointExternalLinksContainer}`}
      onClick={onClick}
      cursor="pointer"
    >
      {children}
    </Box>
  )
}

const Icon = ({ href, children }: { href?: string; children: ReactNode }) => {
  return (
    <>
      <Box
        as={href ? 'a' : 'div'}
        href={href ?? undefined}
        target={href ? '_blank' : undefined}
        rel={href ? 'noopener noreferrer' : undefined}
        display="flex"
        flexDirection="column"
        color="blackBlue"
        background="none"
        border="none"
        justifyContent="center"
        textAlign="center"
      >
        {children}
      </Box>
    </>
  )
}

const IconRow = ({ children }: { children: ReactNode }) => {
  return <Row className={styles.IconRow}>{children}</Row>
}

const Seperator = () => {
  return <Box className={styles.separator} />
}

export const MobileSideBar = () => {
  const [isOpen, toggleOpen] = useReducer((s) => !s, false)
  const togglePrivacyPolicy = useTogglePrivacyPolicy()
  const openFeatureFlagsModal = useToggleModal(ApplicationModal.FEATURE_FLAGS)
  const { pathname } = useLocation()
  const isPoolActive =
    pathname.startsWith('/pool') ||
    pathname.startsWith('/add') ||
    pathname.startsWith('/remove') ||
    pathname.startsWith('/increase') ||
    pathname.startsWith('/find')

  return (
    <>
      <NavIcon onClick={toggleOpen}>
        <HamburgerIcon width={28} height={28} />
      </NavIcon>
      {isOpen && (
        <Portal>
          <Column className={styles.sidebar}>
            <Column>
              <Row justifyContent="flex-end" marginTop="14" marginBottom="20" marginRight="8">
                <Box as="button" onClick={toggleOpen} className={styles.iconContainer}>
                  <CloseIcon className={styles.icon} />
                </Box>
              </Row>
              <Column gap="4">
                <NavLinkRow href="/swap" close={toggleOpen} isActive={pathname.startsWith('/swap')}>
                  Swap
                </NavLinkRow>
                <NavLinkRow href="/explore" close={toggleOpen} isActive={pathname.startsWith('/explore')}>
                  Tokens
                </NavLinkRow>
                <NavLinkRow href="/pool" id={'pool-nav-link'} isActive={isPoolActive} close={toggleOpen}>
                  Pool
                </NavLinkRow>
              </Column>
              <Seperator />
              <Column gap="4">
                <ExtraLinkRow to="/vote" close={toggleOpen}>
                  <Icon>
                    <GovernanceIconMobile width={24} height={24} />
                  </Icon>
                  Vote in governance
                </ExtraLinkRow>
                <ExtraLinkRow href="https://info.uniswap.org/#/" close={toggleOpen}>
                  <Icon>
                    <BarChartIconMobile width={24} height={24} />
                  </Icon>
                  View token analytics ↗
                </ExtraLinkRow>
              </Column>
            </Column>
            <Column>
              <Row justifyContent="center" marginBottom="12" flexWrap="wrap">
                <Row className={styles.bottomExternalLinks}>
                  <BottomExternalLink href="https://help.uniswap.org/en/" onClick={toggleOpen}>
                    Help center ↗
                  </BottomExternalLink>
                  <BulletIcon />
                  <BottomExternalLink href="https://docs.uniswap.org/" onClick={toggleOpen}>
                    Documentation ↗
                  </BottomExternalLink>
                  <BulletIcon />
                  <BottomExternalLink
                    onClick={() => {
                      toggleOpen()
                      togglePrivacyPolicy()
                    }}
                  >
                    {`Legal & Privacy`}
                  </BottomExternalLink>
                </Row>
                {(isDevelopmentEnv() || isStagingEnv()) && (
                  <>
                    <BulletIcon />
                    <BottomExternalLink onClick={openFeatureFlagsModal}>{`Feature Flags`}</BottomExternalLink>
                  </>
                )}
              </Row>
              <Row justifyContent="center">
                <IconRow>
                  <Icon href="https://discord.com/invite/FCfyBSbCU5">
                    <DiscordIconMenuMobile width={32} height={32} color={themeVars.colors.darkGray} />
                  </Icon>
                  <Icon href="https://twitter.com/Uniswap">
                    <TwitterIconMenuMobile width={32} height={32} color={themeVars.colors.darkGray} />
                  </Icon>
                  <Icon href="https://github.com/Uniswap">
                    <GithubIconMenuMobile width={32} height={32} color={themeVars.colors.darkGray} />
                  </Icon>
                </IconRow>
              </Row>
            </Column>
          </Column>
        </Portal>
      )}
      <PrivacyPolicyModal />
      <FeatureFlagModal />
    </>
  )
}
