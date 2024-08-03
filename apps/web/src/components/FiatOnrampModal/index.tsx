import Circle from 'assets/images/blue-loader.svg'
import { MOONPAY_SUPPORTED_CURRENCY_CODES } from 'components/FiatOnrampModal/constants'
import { getDefaultCurrencyCode, parsePathParts } from 'components/FiatOnrampModal/utils'
import { getChain, getChainFromChainUrlParam, getChainUrlParam } from 'constants/chains'
import { useAccount } from 'hooks/useAccount'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { Trans } from 'i18n'
import styled, { useTheme } from 'lib/styled-components'
import { useCallback, useEffect, useState } from 'react'
import { useHref } from 'react-router-dom'
import { useCloseModal, useModalIsOpen } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import { CustomLightSpinner, ThemedText } from 'theme/components'
import { useIsDarkMode } from 'theme/components/ThemeToggle'
import { AdaptiveWebModalSheet } from 'ui/src'
import { logger } from 'utilities/src/logger/logger'

const MOONPAY_DARK_BACKGROUND = '#1c1c1e'
const Wrapper = styled.div<{ isDarkMode: boolean }>`
  // #1c1c1e is the background color for the darkmode moonpay iframe as of 2/16/2023
  background-color: ${({ isDarkMode, theme }) => (isDarkMode ? MOONPAY_DARK_BACKGROUND : theme.white)};
  border-radius: 20px;
  box-shadow: ${({ theme }) => theme.deprecated_deepShadow};
  display: flex;
  flex-flow: column nowrap;
  margin: 0;
  flex: 1 1;
  min-width: 375px;
  position: relative;
  width: 100%;
`

const ErrorText = styled(ThemedText.BodyPrimary)`
  color: ${({ theme }) => theme.critical};
  margin: auto !important;
  text-align: center;
  width: 90%;
`
const StyledIframe = styled.iframe<{ isDarkMode: boolean }>`
  // #1c1c1e is the background color for the darkmode moonpay iframe as of 2/16/2023
  background-color: ${({ isDarkMode, theme }) => (isDarkMode ? MOONPAY_DARK_BACKGROUND : theme.white)};
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

const MoonpayTextWrapper = styled.div`
  position: absolute;
  bottom: 20px;
  margin: auto;
  left: 0;
  right: 0;
  width: 100%;
  text-align: center;
`

export default function FiatOnrampModal() {
  const account = useAccount()
  const theme = useTheme()
  const isDarkMode = useIsDarkMode()
  const closeModal = useCloseModal()
  const fiatOnrampModalOpen = useModalIsOpen(ApplicationModal.FIAT_ONRAMP)

  const { chain, tokenAddress } = parsePathParts(location.pathname)
  const parsedChainName = useParsedQueryString().chain
  const queryChain =
    typeof parsedChainName === 'string' ? getChainFromChainUrlParam(getChainUrlParam(parsedChainName)) : undefined
  const accountChainInfo = getChain({ chainId: account.chainId })

  const [signedIframeUrl, setSignedIframeUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const swapUrl = useHref('/swap')

  const fetchSignedIframeUrl = useCallback(async () => {
    if (!account.isConnected) {
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
          theme: isDarkMode ? 'dark' : 'light',
          colorCode: theme.accent1,
          defaultCurrencyCode: getDefaultCurrencyCode(
            tokenAddress,
            chain?.backendChain.chain ?? queryChain?.backendChain.chain ?? accountChainInfo?.backendChain.chain,
          ),
          redirectUrl: swapUrl,
          walletAddresses: JSON.stringify(
            MOONPAY_SUPPORTED_CURRENCY_CODES.reduce(
              (acc, currencyCode) => ({
                ...acc,
                [currencyCode]: account.address,
              }),
              {},
            ),
          ),
        }),
      })
      const { url } = await res.json()
      setSignedIframeUrl(url)
    } catch (e) {
      logger.info('FiatOnrampModal', 'fetchSingedIframeUrl', 'there was an error fetching the link', e)
      setError(e.toString())
    } finally {
      setLoading(false)
    }
  }, [
    account.address,
    account.isConnected,
    accountChainInfo?.backendChain.chain,
    chain?.backendChain.chain,
    isDarkMode,
    queryChain?.backendChain.chain,
    swapUrl,
    theme.accent1,
    tokenAddress,
  ])

  useEffect(() => {
    fetchSignedIframeUrl()
  }, [fetchSignedIframeUrl])

  return (
    <AdaptiveWebModalSheet isOpen={fiatOnrampModalOpen} onClose={() => closeModal()}>
      <Wrapper data-testid="fiat-onramp-modal" isDarkMode={isDarkMode}>
        {error ? (
          <>
            <ThemedText.MediumHeader>
              <Trans i18nKey="moonpay.rampIframe" />
            </ThemedText.MediumHeader>
            <ErrorText>
              <Trans i18nKey="common.error.somethingWrong" />
              <br />
              {error}
            </ErrorText>
          </>
        ) : loading ? (
          <StyledSpinner src={Circle} alt="loading spinner" size="90px" />
        ) : (
          <StyledIframe
            src={signedIframeUrl ?? ''}
            frameBorder="0"
            title="fiat-onramp-iframe"
            isDarkMode={isDarkMode}
          />
        )}
      </Wrapper>
      <MoonpayTextWrapper>
        <ThemedText.BodySmall color="neutral3">
          <Trans i18nKey="moonpay.poweredBy" />
        </ThemedText.BodySmall>
      </MoonpayTextWrapper>
    </AdaptiveWebModalSheet>
  )
}
