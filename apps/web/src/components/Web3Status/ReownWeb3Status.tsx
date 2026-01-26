import { useState } from 'react'
import { useAppKit, useAppKitAccount, useAppKitConnectionStatus, useDisconnect, useWalletInfo } from 'components/Web3Provider/reownConfig'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Text } from 'ui/src'
import { shortenAddress } from 'utilities/src/addresses'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { CopyAlt } from 'ui/src/components/icons/CopyAlt'
import { CheckCircleFilled } from 'ui/src/components/icons/CheckCircleFilled'
import useCopyClipboard from 'hooks/useCopyClipboard'
// biome-ignore lint/style/noRestrictedImports: wagmi hook needed for wallet disconnection
import { useDisconnect as useDisconnectWagmi } from 'wagmi'

const ConnectButtonStyled = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '9px 16px',
  width: '134px',
  height: '36px',
  background: '#2362DD',
  boxShadow: '0px 0px 20px -5px #2362DD',
  borderRadius: '8px',
  border: 'none',
  cursor: 'pointer',
  fontFamily: "'Aleo', sans-serif",
  fontWeight: 500,
  fontSize: '14px',
  lineHeight: '20px',
  color: '#FFFFFF',
} as const

export default function ReownWeb3Status(): JSX.Element {
  const { t } = useTranslation()
  const { open } = useAppKit()
  const reownDisconnect = useDisconnect()
  const { disconnect: wagmiDisconnect } = useDisconnectWagmi()
  const { address, isConnected } = useAppKitAccount()
  const { isConnecting } = useAppKitConnectionStatus()
  const { walletInfo } = useWalletInfo()
  const [accountModalOpen, setAccountModalOpen] = useState(false)
  const [copied, copyToClipboard] = useCopyClipboard()

  // Prevent multiple connection attempts
  const handleConnect = () => {
    if (isConnecting) {
      return
    }
    open({ view: 'Connect' })
  }

  const handleAccountClick = () => {
    if (isConnecting) {
      return
    }
    if (isConnected) {
      setAccountModalOpen(true)
    } else {
      open({ view: 'Connect' })
    }
  }

  const handleDisconnect = () => {
    // Try both Reown disconnect and Wagmi disconnect to ensure it works
    try {
      // First try Reown's disconnect (matching hsk-staking-launchpad)
      // useDisconnect from Reown returns an object with disconnect property
      const disconnectFn = (reownDisconnect as any)?.disconnect || reownDisconnect
      if (disconnectFn && typeof disconnectFn === 'function') {
        disconnectFn()
      }
      
      // Also call Wagmi disconnect directly to ensure disconnection
      if (wagmiDisconnect) {
        wagmiDisconnect()
      }
    } catch (error) {
      // Still try wagmi disconnect as fallback
      try {
        if (wagmiDisconnect) {
          wagmiDisconnect()
        }
      } catch (fallbackError) {
        // Fallback disconnect failed
      }
    }
    // Always close the modal (matching hsk-staking-launchpad behavior)
    setAccountModalOpen(false)
  }

  const handleCopyAddress = () => {
    if (address) {
      copyToClipboard(address)
    }
  }

  if (isConnecting) {
    return (
      <Flex row>
        <Button
          size="xsmall"
          emphasis="text-only"
          userSelect="none"
          backgroundColor="$transparent"
          loading
          isDisabled
        >
          {t('common.connecting')}
        </Button>
      </Flex>
    )
  }

  if (isConnected && address) {
    // Show account button with custom modal (matching hsk-staking-launchpad experience)
    return (
      <>
        <Flex row>
          <button
            onClick={handleAccountClick}
            disabled={isConnecting}
            style={{
              ...ConnectButtonStyled,
              width: 'auto',
              minWidth: '134px',
              padding: '9px 16px',
              opacity: isConnecting ? 0.6 : 1,
              cursor: isConnecting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {walletInfo?.icon && (
              <img 
                src={walletInfo.icon} 
                alt={walletInfo.name || 'Wallet'} 
                style={{ width: '16px', height: '16px', borderRadius: '50%' }}
              />
            )}
            <span>{shortenAddress({ address, chars: 4, charsEnd: 4 })}</span>
          </button>
        </Flex>

        {/* Custom Account Modal (matching hsk-staking-launchpad exactly) */}
        <Modal 
          name={ModalName.Settings} 
          isModalOpen={accountModalOpen} 
          onClose={() => setAccountModalOpen(false)}
        >
          <Flex gap="$spacing16" p="$padding24">
            <Text variant="subheading1" color="$neutral1">
              Account
            </Text>

            <Flex gap="$spacing12" p="$padding16" backgroundColor="$surface2" borderRadius="$rounded12">
              <Flex row alignItems="center" gap="$spacing8">
                <Flex width={8} height={8} borderRadius={4} backgroundColor="$statusSuccess" />
                <Text variant="body2" color="$neutral2">
                  Connect with {walletInfo?.name || 'Wallet'}
                </Text>
              </Flex>

              <Flex row alignItems="center" gap="$spacing12">
                {walletInfo?.icon && (
                  <Flex width={32} height={32} borderRadius={16} overflow="hidden">
                    <img 
                      src={walletInfo.icon} 
                      alt={walletInfo.name || 'Wallet'} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </Flex>
                )}
                <Text variant="body1" color="$neutral1">
                  {shortenAddress({ address, chars: 6, charsEnd: 4 })}
                </Text>
                <Button
                  size="small"
                  emphasis="tertiary"
                  onPress={handleCopyAddress}
                  icon={copied ? <CheckCircleFilled color="$statusSuccess" size={16} /> : <CopyAlt color="$neutral2" size={16} />}
                />
              </Flex>
            </Flex>

            <Button
              size="large"
              emphasis="secondary"
              onPress={handleDisconnect}
              width="100%"
            >
              {t('common.button.disconnect')}
            </Button>
          </Flex>
        </Modal>
      </>
    )
  }

  return (
    <Flex row>
      <button
        onClick={handleConnect}
        disabled={isConnecting}
        style={{
          ...ConnectButtonStyled,
          opacity: isConnecting ? 0.6 : 1,
          cursor: isConnecting ? 'not-allowed' : 'pointer',
        }}
        data-testid="navbar-connect-wallet"
      >
        {t('common.connect.button')}
      </button>
    </Flex>
  )
}

