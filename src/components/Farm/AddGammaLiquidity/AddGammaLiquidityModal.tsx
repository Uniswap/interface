import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import Modal from 'components/Modal'
import { RowBetween } from 'components/Row'
import { useCallback, useEffect } from 'react'
import { useModalIsOpen, useToggleAddGammaLiquidityModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import styled, { useTheme } from 'styled-components/macro'
import { CloseIcon, ThemedText } from 'theme'

const Wrapper = styled(RowBetween)`
  display: flex;
  flex-direction: column;
  padding: 20px 16px 16px;
`
const HeaderRow = styled(RowBetween)`
  display: flex;
`
const QRCodeWrapper = styled(RowBetween)`
  aspect-ratio: 1;
  border-radius: 12px;
  background-color: ${({ theme }) => theme.white};
  margin: 24px 32px 20px;
  padding: 10px;
`
const Divider = styled.div`
  border-bottom: 1px solid ${({ theme }) => theme.backgroundOutline};
  width: 100%;
`

export default function AddGammaLiquidityModal() {
  const open = useModalIsOpen(ApplicationModal.ADD_GAMMA_FARM)
  const toggle = useToggleAddGammaLiquidityModal()

  const { account } = useWeb3React()
  useEffect(() => {
    if (open && account) {
      toggle()
    }
  }, [account, open, toggle])

  const onClose = useCallback(() => {
    toggle()
  }, [toggle])

  const theme = useTheme()
  return (
    <Modal isOpen={open} onDismiss={onClose}>
      <Wrapper>
        <HeaderRow>
          <ThemedText.SubHeader>
            <Trans>Scan with Uniswap Wallet</Trans>
          </ThemedText.SubHeader>
          <CloseIcon onClick={onClose} />
        </HeaderRow>
        {/* <QRCodeWrapper>
          {uri && (
            <QRCodeSVG
              value={uri}
              width="100%"
              height="100%"
              level="M"
              fgColor={theme.darkMode ? theme.backgroundSurface : theme.black}
              imageSettings={{
                src: uniPng,
                height: 27,
                width: 27,
                excavate: false,
              }}
            />
          )}
        </QRCodeWrapper>
        <Divider />
        <InfoSection /> */}
      </Wrapper>
    </Modal>
  )
}
