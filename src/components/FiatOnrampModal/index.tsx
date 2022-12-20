import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import { useCallback, useEffect, useState } from 'react'
import { useCloseModal, useModalIsOpen } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import styled, { useTheme } from 'styled-components/macro'
import { CustomLightSpinner, ThemedText } from 'theme'

import Circle from '../../assets/images/blue-loader.svg'
import Modal from '../Modal'

const Wrapper = styled.div`
  background-color: ${({ theme }) => theme.backgroundSurface};
  border-radius: 20px;
  box-shadow: ${({ theme }) => theme.deepShadow};
  display: flex;
  flex-flow: column nowrap;
  margin: 0;
  min-height: 720px;
  min-width: 375px;
  position: relative;
  width: 100%;
`

const ErrorText = styled(ThemedText.BodyPrimary)`
  color: ${({ theme }) => theme.accentFailure};
  margin: auto !important;
  text-align: center;
  width: 90%;
`
const StyledIframe = styled.iframe`
  background-color: ${({ theme }) => theme.white};
  border-radius: 12px;
  bottom: 0;
  left: 0;
  height: calc(100% - 16px);
  margin: 8px;
  padding: 0;
  position: absolute;
  right: 0;
  top: 0;
  width: calc(100% - 16px);
`
const StyledSpinner = styled(CustomLightSpinner)`
  bottom: 0;
  left: 0;
  margin: auto;
  position: absolute;
  right: 0;
  top: 0;
`

const MOONPAY_SUPPORTED_CURRENCY_CODES = [
  'eth',
  'eth_arbitrum',
  'eth_optimism',
  'eth_polygon',
  'weth',
  'wbtc',
  'matic_polygon',
  'polygon',
  'usdc_arbitrum',
  'usdc_optimism',
  'usdc_polygon',
]

export default function FiatOnrampModal() {
  const { account } = useWeb3React()
  const theme = useTheme()
  const closeModal = useCloseModal()
  const fiatOnrampModalOpen = useModalIsOpen(ApplicationModal.FIAT_ONRAMP)

  const [signedIframeUrl, setSignedIframeUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchSignedIframeUrl = useCallback(async () => {
    if (!account) {
      setError('Please connect an account before making a purchase.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const signedIframeUrlFetchEndpoint = process.env.REACT_APP_MOONPAY_LINK as string
      const res = await fetch(signedIframeUrlFetchEndpoint, {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({
          colorCode: theme.accentAction,
          defaultCurrencyCode: 'eth',
          redirectUrl: 'https://app.uniswap.org/#/swap',
          walletAddresses: JSON.stringify(
            MOONPAY_SUPPORTED_CURRENCY_CODES.reduce(
              (acc, currencyCode) => ({
                ...acc,
                [currencyCode]: account,
              }),
              {}
            )
          ),
        }),
      })
      const { url } = await res.json()
      setSignedIframeUrl(url)
    } catch (e) {
      console.log('there was an error fetching the link', e)
      setError(e.toString())
    } finally {
      setLoading(false)
    }
  }, [account, theme.accentAction])

  useEffect(() => {
    fetchSignedIframeUrl()
  }, [fetchSignedIframeUrl])

  return (
    <Modal isOpen={fiatOnrampModalOpen} onDismiss={closeModal} maxHeight={720}>
      <Wrapper data-testid="fiat-onramp-modal">
        {error ? (
          <>
            <ThemedText.MediumHeader>
              <Trans>Moonpay Fiat On-ramp iframe</Trans>
            </ThemedText.MediumHeader>
            <ErrorText>
              <Trans>something went wrong!</Trans>
              <br />
              {error}
            </ErrorText>
          </>
        ) : loading ? (
          <StyledSpinner src={Circle} alt="loading spinner" size="90px" />
        ) : (
          <StyledIframe src={signedIframeUrl ?? ''} frameBorder="0" title="fiat-onramp-iframe" />
        )}
      </Wrapper>
    </Modal>
  )
}
