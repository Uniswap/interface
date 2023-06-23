import { Trans } from '@lingui/macro'
import { ButtonPrimary } from 'components/Button'
import { AutoColumn, ColumnCenter } from 'components/Column'
import Modal from 'components/Modal'
import { Icon } from 'components/NavBar/MenuDropdown'
import { RowBetween } from 'components/Row'
import { Box } from 'nft/components/Box'
import { Row } from 'nft/components/Flex'
import { useEffect, useRef } from 'react'
import { Text } from 'rebass'
import { useModalIsOpen, useTogglePaliMobile } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import styled, { useTheme } from 'styled-components/macro'
import { CloseIcon, ThemedText } from 'theme'

import { ReactComponent as PaliLogo } from '../../assets/svg/pali.svg'
import * as styles from '../NavBar/MenuDropdown.css'
// eslint-disable-next-line import/no-unused-modules

const Wrapper = styled.div`
  background-color: ${({ theme }) => theme.backgroundSurface};
  border-radius: 20px;
  width: 100%;
  padding: 1rem;
`
const Section = styled(AutoColumn)<{ inline?: boolean }>`
  padding: ${({ inline }) => (inline ? '0' : '0')};
`

const ConfirmedIcon = styled(ColumnCenter)<{ inline?: boolean }>`
  padding: ${({ inline }) => (inline ? '20px 0' : '32px 0;')};
`

// eslint-disable-next-line import/no-unused-modules
export function PaliMobileModal() {
  const node = useRef<HTMLDivElement>()
  const open = useModalIsOpen(ApplicationModal.PALI_MOBILE)
  const toggle = useTogglePaliMobile()
  const theme = useTheme()

  useEffect(() => {
    if (!open) return
  }, [open])

  return (
    <Modal isOpen={open} $scrollOverlay={true} onDismiss={() => toggle()} maxHeight={90}>
      <Wrapper ref={node as any}>
        <Section inline={true}>
          <RowBetween>
            <div />
            <CloseIcon onClick={() => toggle()} />
          </RowBetween>

          <ConfirmedIcon inline={true}>
            <Icon>
              <PaliLogo width="75px" height="75px" />
            </Icon>
          </ConfirmedIcon>

          <AutoColumn gap="md" justify="center" style={{ paddingBottom: '12px' }}>
            <ThemedText.MediumHeader textAlign="center">
              <Trans>Choose your download link</Trans>
            </ThemedText.MediumHeader>
          </AutoColumn>

          <Row display="flex">
            <Row
              as="a"
              href="https://play.google.com/store/apps/details?id=io.paliwallet&pli=1"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.MenuRow}
              style={{ cursor: 'pointer' }}
              padding="0"
              marginTop="20"
              borderRadius="20"
            >
              <ButtonPrimary onClick={() => toggle()}>
                <Text fontWeight={600} fontSize={20} color={theme.accentTextLightPrimary}>
                  <Trans>Android</Trans>
                </Text>
              </ButtonPrimary>
            </Row>

            <Box display="flex" paddingX="10" />

            <Row
              as="a"
              href="https://apps.apple.com/us/app/pali-wallet-dex-nft-defi/id6447639615"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.MenuRow}
              style={{ cursor: 'pointer' }}
              padding="0"
              marginTop="20"
              borderRadius="20"
            >
              <ButtonPrimary onClick={() => toggle()}>
                <Text fontWeight={600} fontSize={20} color={theme.accentTextLightPrimary}>
                  <Trans>IOS</Trans>
                </Text>
              </ButtonPrimary>
            </Row>
          </Row>
        </Section>
      </Wrapper>
    </Modal>
  )
}
