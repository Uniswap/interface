import FeatureFlagModal from 'components/FeatureFlagModal/FeatureFlagModal'
import { PrivacyPolicyModal } from 'components/PrivacyPolicy'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { Box } from 'nft/components/Box'
import { Column, Row } from 'nft/components/Flex'
import {
  BarChartIcon,
  DiscordIconMenu,
  EllipsisIcon,
  GithubIconMenu,
  GovernanceIcon,
  TwitterIconMenu,
} from 'nft/components/icons'
import { body, bodySmall } from 'nft/css/common.css'
import { themeVars } from 'nft/css/sprinkles.css'
import { ReactNode, useReducer, useRef } from 'react'
import { NavLink, NavLinkProps } from 'react-router-dom'
import { isDevelopmentEnv, isStagingEnv } from 'utils/env'

import { useToggleModal } from '../../state/application/hooks'
import { ApplicationModal } from '../../state/application/reducer'
import * as styles from './MenuDropdown.css'
import { NavDropdown } from './NavDropdown'
import { NavIcon } from './NavIcon'

const PrimaryMenuRow = ({
  to,
  href,
  close,
  children,
}: {
  to?: NavLinkProps['to']
  href?: string
  close?: () => void
  children: ReactNode
}) => {
  return (
    <>
      {to ? (
        <NavLink to={to} className={styles.MenuRow}>
          <Row onClick={close}>{children}</Row>
        </NavLink>
      ) : (
        <Row as="a" href={href} target={'_blank'} rel={'noopener noreferrer'} className={styles.MenuRow}>
          {children}
        </Row>
      )}
    </>
  )
}

const PrimaryMenuRowText = ({ children }: { children: ReactNode }) => {
  return <Box className={`${styles.PrimaryText} ${body}`}>{children}</Box>
}

PrimaryMenuRow.Text = PrimaryMenuRowText

const SecondaryLinkedText = ({
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
      className={`${styles.SecondaryText} ${bodySmall}`}
      onClick={onClick}
      cursor="pointer"
    >
      {children}
    </Box>
  )
}

const Separator = () => {
  return <Box className={styles.Separator} />
}

const IconRow = ({ children }: { children: ReactNode }) => {
  return <Row className={styles.IconRow}>{children}</Row>
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
        marginRight="12"
      >
        {children}
      </Box>
    </>
  )
}

export const MenuDropdown = () => {
  const [isOpen, toggleOpen] = useReducer((s) => !s, false)
  const togglePrivacyPolicy = useToggleModal(ApplicationModal.PRIVACY_POLICY)
  const openFeatureFlagsModal = useToggleModal(ApplicationModal.FEATURE_FLAGS)

  const ref = useRef<HTMLDivElement>(null)
  useOnClickOutside(ref, isOpen ? toggleOpen : undefined)

  return (
    <>
      <Box position="relative" ref={ref}>
        <NavIcon onClick={toggleOpen}>
          <EllipsisIcon width={28} height={28} />
        </NavIcon>

        {isOpen && (
          <NavDropdown top={60}>
            <Column gap="12">
              <Column paddingX="16" gap="4">
                <PrimaryMenuRow to="/vote" close={toggleOpen}>
                  <Icon>
                    <GovernanceIcon width={24} height={24} />
                  </Icon>
                  <PrimaryMenuRow.Text>Vote in governance</PrimaryMenuRow.Text>
                </PrimaryMenuRow>
                <PrimaryMenuRow href="https://info.uniswap.org/#/">
                  <Icon>
                    <BarChartIcon width={24} height={24} />
                  </Icon>
                  <PrimaryMenuRow.Text>View token analytics ↗</PrimaryMenuRow.Text>
                </PrimaryMenuRow>
              </Column>
              <Separator />
              <Column paddingX="16" gap="4">
                <SecondaryLinkedText href="https://help.uniswap.org/en/">Help center ↗</SecondaryLinkedText>
                <SecondaryLinkedText href="https://docs.uniswap.org/">Documentation ↗</SecondaryLinkedText>
                <SecondaryLinkedText
                  onClick={() => {
                    toggleOpen()
                    togglePrivacyPolicy()
                  }}
                >{`Legal & Privacy`}</SecondaryLinkedText>
                {(isDevelopmentEnv() || isStagingEnv()) && (
                  <SecondaryLinkedText onClick={openFeatureFlagsModal}>{`Feature Flags`}</SecondaryLinkedText>
                )}
              </Column>
              <IconRow>
                <Icon href="https://discord.com/invite/FCfyBSbCU5">
                  <DiscordIconMenu width={24} height={24} color={themeVars.colors.darkGray} />
                </Icon>
                <Icon href="https://twitter.com/Uniswap">
                  <TwitterIconMenu width={24} height={24} color={themeVars.colors.darkGray} />
                </Icon>
                <Icon href="https://github.com/Uniswap">
                  <GithubIconMenu width={24} height={24} color={themeVars.colors.darkGray} />
                </Icon>
              </IconRow>
            </Column>
          </NavDropdown>
        )}
      </Box>
      <PrivacyPolicyModal />
      <FeatureFlagModal />
    </>
  )
}
