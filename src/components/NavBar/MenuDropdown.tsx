import { t, Trans } from '@lingui/macro'
import { ReactComponent as AppleLogo } from 'assets/svg/apple_logo.svg'
import FeatureFlagModal from 'components/FeatureFlagModal/FeatureFlagModal'
import { PrivacyPolicyModal } from 'components/PrivacyPolicy'
import { APP_STORE_LINK } from 'components/WalletDropdown/DownloadButton'
import NewBadge from 'components/WalletModal/NewBadge'
import { useMgtmEnabled, useMGTMMicrositeEnabled } from 'featureFlags/flags/mgtm'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { Box } from 'nft/components/Box'
import { Column, Row } from 'nft/components/Flex'
import { BarChartIcon, EllipsisIcon, GovernanceIcon, PoolIcon } from 'nft/components/icons'
import { body, bodySmall } from 'nft/css/common.css'
import { ReactNode, useReducer, useRef } from 'react'
import { DollarSign, HelpCircle, Shield, Terminal } from 'react-feather'
import { NavLink, NavLinkProps } from 'react-router-dom'
import styled, { useTheme } from 'styled-components/macro'
import { isDevelopmentEnv, isStagingEnv } from 'utils/env'

import { useToggleModal, useToggleTaxServiceModal } from '../../state/application/hooks'
import { ApplicationModal } from '../../state/application/reducer'
import * as styles from './MenuDropdown.css'
import { NavDropdown } from './NavDropdown'
import { NavIcon } from './NavIcon'

const PrimaryMenuRow = ({
  to,
  href,
  close,
  children,
  onClick,
}: {
  to?: NavLinkProps['to']
  href?: string
  close?: () => void
  children: ReactNode
  onClick?: () => void
}) => {
  return (
    <>
      {to ? (
        <NavLink to={to} className={styles.MenuRow} onClick={onClick}>
          <Row onClick={close}>{children}</Row>
        </NavLink>
      ) : (
        <Row
          as="a"
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.MenuRow}
          onClick={onClick}
          cursor="pointer"
        >
          {children}
        </Row>
      )}
    </>
  )
}

const StyledBox = styled(Box)`
  align-items: center;
  display: flex;
  justify-content: center;
`
const PrimaryMenuRowText = ({ children }: { children: ReactNode }) => {
  return <StyledBox className={`${styles.PrimaryText} ${body}`}>{children}</StyledBox>
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
        color="textSecondary"
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

const StyledAppleLogo = styled(AppleLogo)`
  fill: ${({ theme }) => theme.textSecondary};
  padding: 2px;
  width: 24px;
  height: 24px;
`

const BadgeWrapper = styled.div`
  margin-left: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
`

export const MenuDropdown = () => {
  const [isOpen, toggleOpen] = useReducer((s) => !s, false)
  const togglePrivacyPolicy = useToggleModal(ApplicationModal.PRIVACY_POLICY)
  const openFeatureFlagsModal = useToggleModal(ApplicationModal.FEATURE_FLAGS)
  const ref = useRef<HTMLDivElement>(null)
  useOnClickOutside(ref, isOpen ? toggleOpen : undefined)
  const toggleTaxServiceModal = useToggleTaxServiceModal()
  const theme = useTheme()

  const mgtmEnabled = useMgtmEnabled()
  const micrositeEnabled = useMGTMMicrositeEnabled()

  return (
    <>
      <Box position="relative" ref={ref}>
        <NavIcon
          isActive={isOpen}
          onClick={toggleOpen}
          label={isOpen ? t`Show resources` : t`Hide resources`}
          activeBackground={isOpen}
        >
          <EllipsisIcon
            viewBox="0 0 20 20"
            width={24}
            height={24}
            color={isOpen ? theme.accentActive : theme.textSecondary}
          />
        </NavIcon>

        {isOpen && (
          <NavDropdown top={{ sm: 'unset', lg: '56' }} bottom={{ sm: '56', lg: 'unset' }} right="0">
            <Column gap="16">
              <Column paddingX="8" gap="4">
                <Box display={{ sm: 'none', lg: 'flex', xxl: 'none' }}>
                  <PrimaryMenuRow to="/pool" close={toggleOpen}>
                    <Icon>
                      <PoolIcon width={24} height={24} color={theme.textSecondary} />
                    </Icon>
                    <PrimaryMenuRow.Text>
                      <Trans>Pool</Trans>
                    </PrimaryMenuRow.Text>
                  </PrimaryMenuRow>
                </Box>
                <PrimaryMenuRow to="/vote" close={toggleOpen}>
                  <Icon>
                    <GovernanceIcon width={24} height={24} />
                  </Icon>
                  <PrimaryMenuRow.Text>
                    <Trans>Governance</Trans>
                  </PrimaryMenuRow.Text>
                </PrimaryMenuRow>
                <PrimaryMenuRow href="https://info.uniswap.org/#/">
                  <Icon>
                    <BarChartIcon width={24} height={24} />
                  </Icon>
                  <PrimaryMenuRow.Text>
                    <Trans>Token analytics</Trans>
                  </PrimaryMenuRow.Text>
                </PrimaryMenuRow>
                <PrimaryMenuRow href="https://help.uniswap.org/en/">
                  <Icon>
                    <HelpCircle color={theme.textSecondary} />
                  </Icon>
                  <PrimaryMenuRow.Text>
                    <Trans>Help center</Trans>
                  </PrimaryMenuRow.Text>
                </PrimaryMenuRow>
                <PrimaryMenuRow href="https://docs.uniswap.org/">
                  <Icon>
                    <Terminal color={theme.textSecondary} />
                  </Icon>
                  <PrimaryMenuRow.Text>
                    <Trans>Documentation</Trans>
                  </PrimaryMenuRow.Text>
                </PrimaryMenuRow>
                <PrimaryMenuRow
                  onClick={() => {
                    toggleOpen()
                    togglePrivacyPolicy()
                  }}
                >
                  <Icon>
                    <Shield color={theme.textSecondary} />
                  </Icon>
                  <PrimaryMenuRow.Text>
                    <Trans>Legal & Privacy</Trans>
                  </PrimaryMenuRow.Text>
                </PrimaryMenuRow>
                <PrimaryMenuRow
                  onClick={() => {
                    toggleTaxServiceModal()
                    toggleOpen()
                  }}
                >
                  <Icon>
                    <DollarSign size="24px" color={theme.textSecondary} />
                  </Icon>
                  <PrimaryMenuRow.Text>
                    <Trans>Tax Services</Trans>
                  </PrimaryMenuRow.Text>
                </PrimaryMenuRow>
                {mgtmEnabled && (
                  <Box display={micrositeEnabled ? { xxl: 'flex', xxxl: 'none' } : 'flex'}>
                    <PrimaryMenuRow
                      to={micrositeEnabled ? '/wallet' : undefined}
                      href={micrositeEnabled ? undefined : APP_STORE_LINK}
                      close={toggleOpen}
                    >
                      <Icon>
                        <StyledAppleLogo />
                      </Icon>
                      <PrimaryMenuRow.Text>
                        <Trans>Uniswap Wallet</Trans>
                      </PrimaryMenuRow.Text>
                      <BadgeWrapper>
                        <NewBadge />
                      </BadgeWrapper>
                    </PrimaryMenuRow>
                  </Box>
                )}
                {(isDevelopmentEnv() || isStagingEnv()) && (
                  <>
                    <Separator />
                    <SecondaryLinkedText onClick={openFeatureFlagsModal}>
                      <Trans>Feature Flags</Trans>
                    </SecondaryLinkedText>
                  </>
                )}
              </Column>
            </Column>
          </NavDropdown>
        )}
      </Box>
      <PrivacyPolicyModal />
      <FeatureFlagModal />
    </>
  )
}
