import { Trans, t } from '@lingui/macro'
import { useMemo, useRef } from 'react'
import { isMobile } from 'react-device-detect'
import { Download } from 'react-feather'
import { QRCode, IProps as QRCodeProps } from 'react-qrcode-logo'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import KncLogo from 'assets/images/kyber_logo_for_qr.png'
import { AddressInput } from 'components/AddressInputPanel'
import Column from 'components/Column'
import CopyHelper from 'components/Copy'
import { MouseoverTooltip } from 'components/Tooltip'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { shortenAddress } from 'utils'

const QR_SIZE = 200
const QR_ID = 'react-qrcode-logo'

const Label = styled.label<{ color?: string }>`
  font-weight: 500;
  font-size: 12px;
  line-height: 16px;
  color: ${({ theme, color }) => color ?? theme.subText};
`

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1 1 100%;
  gap: 14px;
  justify-content: space-between;
  overflow-y: scroll;
  &::-webkit-scrollbar {
    display: block;
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.disableText};
  }
  #${QR_ID} {
    border-radius: 16px;
  }
`

export default function ReceiveToken() {
  const { account = '', chainId, isEVM } = useActiveWeb3React()
  const copyButtonRef = useRef<HTMLDivElement>(null)

  const qrCodeProps: QRCodeProps | undefined = useMemo(() => {
    if (!account) {
      return undefined
    }

    return {
      logoImage: KncLogo,
      logoWidth: 32,
      logoHeight: 32,
      size: QR_SIZE,
      // `ethereum` is intentional. This QR is used to open the Send feature on the wallet (e.g. Metamask)
      // Chain is not switched by this prefix
      value: isEVM ? `ethereum:${account}` : account,
      eyeColor: { outer: '#000000', inner: '#000000' },
      quietZone: 14,
      removeQrCodeBehindLogo: true,
    }
  }, [account, isEVM])

  const onCopy = async () => {
    copyButtonRef.current?.click()
  }

  const downloadQR = () => {
    try {
      const canvas = document.getElementById(QR_ID) as HTMLCanvasElement
      if (!canvas) return
      const link = document.createElement('a')
      link.download = 'your_qrcode-logo.png'

      link.href = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream')
      link.click()
    } catch (error) {
      console.error(error)
    }
  }

  const theme = useTheme()

  let qrElement = null
  let error = true
  try {
    error = false
    qrElement = qrCodeProps ? <QRCode {...qrCodeProps} /> : <Flex sx={{ width: '228px', height: '228px' }} />
  } catch (e) {
    qrElement = (
      <Flex
        sx={{
          // match size of QR
          width: '228px',
          height: '228px',
          borderRadius: '16px',
          justifyContent: 'center',
          alignItems: 'center',
          border: `2px solid ${theme.border}`,
          textAlign: 'center',
          color: theme.subText,
          fontSize: '14px',
        }}
      >
        <Trans>
          Something went wrong,
          <br />
          please try again
        </Trans>
      </Flex>
    )
  }

  return (
    <Wrapper>
      <Flex flexDirection={'column'} style={{ gap: 32, flex: 1, justifyContent: 'center' }}>
        <Column
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            gap: 12,
          }}
        >
          {qrElement}

          {!error && !isMobile && (
            <Flex
              onClick={downloadQR}
              color={theme.primary}
              fontSize="14px"
              alignItems={'center'}
              style={{ gap: 5, cursor: 'pointer' }}
            >
              <Text>
                <Trans>Download Image</Trans>
              </Text>
              <Download size={14} />
            </Flex>
          )}
        </Column>

        <Column gap="12px">
          <Label>
            <Trans>Your Wallet Address</Trans>
          </Label>

          <MouseoverTooltip placement="bottom" text={t`Copy address to clipboard`}>
            <Flex
              onClick={onCopy}
              role="button"
              sx={{
                flexDirection: 'column',
                width: '100%',
                cursor: 'pointer',
              }}
            >
              <AddressInput
                style={{ color: theme.subText, cursor: 'pointer' }}
                disabled
                value={shortenAddress(chainId, account, 17, false)}
                icon={<CopyHelper ref={copyButtonRef} toCopy={account} style={{ color: theme.subText }} />}
              />
            </Flex>
          </MouseoverTooltip>
        </Column>
      </Flex>
    </Wrapper>
  )
}
