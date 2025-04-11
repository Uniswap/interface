// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import type { GestureReponderEvent } from '@tamagui/core'
import Column from 'components/deprecated/Column'
import styled, { useTheme } from 'lib/styled-components'
import { Portal } from 'nft/components/common/Portal'
import { Overlay } from 'nft/components/modals/Overlay'
import { Listing, WalletAsset } from 'nft/types'
import { AlertTriangle, X } from 'react-feather'
import { Trans, useTranslation } from 'react-i18next'
import { ThemedText } from 'theme/components'
import { Z_INDEX } from 'theme/zIndex'
import { Button } from 'ui/src'
import { breakpoints } from 'ui/src/theme'
import { useFormatter } from 'utils/formatNumbers'

const ModalWrapper = styled(Column)`
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 420px;
  z-index: ${Z_INDEX.modal};
  background: ${({ theme }) => theme.surface1};
  border-radius: 20px;
  border: 1px solid ${({ theme }) => theme.surface3};
  box-shadow: ${({ theme }) => theme.deprecated_deepShadow};
  padding: 20px 24px 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;

  @media screen and (max-width: ${breakpoints.md}px) {
    width: 100%;
  }
`
const CloseIconWrapper = styled.div`
  display: flex;
  width: 100%;
  justify-content: flex-end;
`
const CloseIcon = styled(X)`
  cursor: pointer;
  &:hover {
    opacity: 0.6;
  }
`

const HazardIconWrap = styled.div`
  display: flex;
  width: 100%;
  justify-content: center;
  align-items: center;
  padding: 32px 120px;
`

const EditListings = styled.span`
  font-weight: 535;
  font-size: 16px;
  line-height: 20px;
  color: ${({ theme }) => theme.accent1};
  text-align: center;
  cursor: pointer;
  padding: 12px 16px;

  &:hover {
    opacity: 0.6;
  }
`

export const BelowFloorWarningModal = ({
  listingsBelowFloor,
  closeModal,
  startListing,
}: {
  listingsBelowFloor: [WalletAsset, Listing][]
  closeModal: () => void
  startListing: () => void
}) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const { formatDelta } = useFormatter()
  const clickContinue = (e: GestureReponderEvent) => {
    e.preventDefault()
    e.stopPropagation()
    startListing()
    closeModal()
  }

  const delta = formatDelta(
    (1 - (listingsBelowFloor[0][1].price ?? 0) / (listingsBelowFloor[0][0].floorPrice ?? 0)) * 100,
  )

  return (
    <Portal>
      <ModalWrapper>
        <CloseIconWrapper>
          <CloseIcon width={24} height={24} onClick={closeModal} />{' '}
        </CloseIconWrapper>
        <HazardIconWrap>
          <AlertTriangle height={90} width={90} color={theme.critical} />
        </HazardIconWrap>
        <ThemedText.HeadlineSmall lineHeight="28px" textAlign="center">
          <Trans i18nKey="nft.lowPrice" />
        </ThemedText.HeadlineSmall>
        <ThemedText.BodyPrimary textAlign="center">
          {t('nft.listedSignificantly', {
            count: listingsBelowFloor.length,
            percentage: delta,
          })}
        </ThemedText.BodyPrimary>
        <Button variant="branded" mt="$spacing12" onPress={clickContinue}>
          <Trans i18nKey="common.button.continue" />
        </Button>
        <EditListings onClick={closeModal}>
          <Trans i18nKey="nft.editListings" />
        </EditListings>
      </ModalWrapper>
      <Overlay onClick={closeModal} />
    </Portal>
  )
}
