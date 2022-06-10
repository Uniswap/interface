import Divider from 'components/Divider'
import React, { useEffect, useMemo, useState } from 'react'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'
import { t, Trans } from '@lingui/macro'
import useTheme from 'hooks/useTheme'
import { VerticalDivider } from 'pages/About/styleds'
import { useActiveWeb3React } from 'hooks'
import { ButtonPrimary } from 'components/Button'
import InfoHelper from 'components/InfoHelper'
import FilterBarToggle from 'components/Toggle/FilterBarToggle'
import { ArrowRight, ChevronDown } from 'react-feather'
import TokensSelect from './TokensSelect'
import Slider from 'components/Slider'
import { NETWORK_ICON, NETWORK_LABEL } from 'constants/networks'
import { Currency, Fraction } from '@kyberswap/ks-sdk-core'
import { useNetworkModalToggle } from 'state/application/hooks'
import NetworkModal from 'components/NetworkModal'
import ShareLinkModal from './ShareLinkModal'
import { currencyId } from 'utils/currencyId'
import { useMedia } from 'react-use'
import { isAddress } from 'utils'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import JSBI from 'jsbi'

const PERCENT_TO_BIP_DENOMINATOR = 100

const PageWrapper = styled.div`
  width: 100%;
  padding: 28px;
  min-width: 343px;
`

const BodyWrapper = styled.div`
  max-width: 1016px;
  background: ${({ theme }) => theme.background};
  border-radius: 8px;
  padding: 20px;
  margin: auto;
`

const AboutDropdown = styled.div`
  padding: 10px 16px;
  border-radius: 4px;
  margin-bottom: 24px;
  background-color: ${({ theme }) => theme.green}20;
  color: ${({ theme }) => theme.text};
`

const AddressBox = styled.div`
  border-radius: 8px;
  background: ${({ theme }) => theme.buttonBlack};
  padding: 12px;
  overflow: hidden;
`

const ReferralCommissionBox = styled.div`
  background: ${({ theme }) => theme.buttonBlack};
  padding: 16px;
  border-radius: 8px;
  width: 100%;
  margin-bottom: 20px;
`
const MaxButton = styled.div`
  border-radius: 3px;
  background: ${({ theme }) => theme.green + '20'};
  background-opacity: 0.2;
  padding: 5px 8px;
  display: inline-block;
  height: 24px;
  cursor: pointer;
`

const NetworkSelect = styled.div`
  background: ${({ theme }) => theme.buttonBlack};
  border-radius: 4px;
  padding: 10px 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
  text-align: left;
  flex: 1;
  position: relative;
  cursor: pointer;
  margin-bottom: 24px;
  font-size: 16px;
`

const AddressInput = styled.input`
  font-size: 16px;
  line-height: 20px;
  color: ${({ theme }) => theme.text};
  background: transparent;
  border: none;
  outline: none;
  width: 100%;
`

const Label = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.subText} !important;
  font-weight: 500;
  margin-bottom: 8px;
  display: none;
  @media only screen and (min-width: 800px) {
    display: block;
  }
`

const CommissionSlider = styled(Slider)`
  width: 100%;
  margin: 0;
  padding: 0 !important;
  &::-webkit-slider-thumb {
    background-color: ${({ theme }) => theme.subText} !important;
    margin: 1px 0;
  }
  &::-moz-range-thumb {
    background-color: ${({ theme }) => theme.subText} !important;
  }
  &::-ms-thumb {
    background-color: ${({ theme }) => theme.subText} !important;
  }
  &::-webkit-slider-runnable-track {
    background: ${({ theme }) => theme.subText};
    height: 2px;
  }

  &::-moz-range-track {
    background: ${({ theme }) => theme.subText};
    height: 2px;
  }
  &::-ms-track {
    background: ${({ theme }) => theme.subText};
  }
`
const ErrorMessage = styled.div`
  color: ${({ theme }) => theme.red};
  font-size: 12px;
  margin-top: 8px;
`
export default function CreateReferral() {
  const { account, chainId } = useActiveWeb3React()
  const theme = useTheme()
  const [isShowChain, setIsShowChain] = useState(true)
  const [isShowTokens, setIsShowTokens] = useState(false)
  const [commission, setCommission] = useState(1)
  const [currencyA, setCurrencyA] = useState<Currency | undefined>()
  const [currencyB, setCurrencyB] = useState<Currency | undefined>()
  const toggleNetworkModal = useNetworkModalToggle()
  const [isShowShareLinkModal, setIsShowShareLinkModal] = useState(false)
  const [address, setAddress] = useState('')
  const [touched, setTouched] = useState(false)
  const isValidAddress = isAddress(address)
  const above1000 = useMedia('(min-width: 1000px)')

  useEffect(() => {
    account && setAddress(account)
  }, [account])

  useEffect(() => {
    setCurrencyA(undefined)
    setCurrencyB(undefined)
  }, [chainId])
  const shareUrl = useMemo(() => {
    if ((address && isShowTokens && currencyA && currencyB) || (address && !isShowTokens)) {
      return (
        window.location.origin +
        '/swap?' +
        `referral=${address}&fee_percent=${commission}${
          isShowTokens
            ? `&inputCurrency=${currencyId(currencyA as Currency, chainId)}&outputCurrency=${currencyId(
                currencyB as Currency,
                chainId,
              )}`
            : ''
        }${isShowChain ? `&networkId=${chainId}` : ''}`
      )
    }
    return ''
  }, [address, commission, currencyA, currencyB, chainId, isShowTokens, isShowChain])

  const swapCurrencies = () => {
    const tempA = currencyA
    setCurrencyA(currencyB)
    setCurrencyB(tempA)
  }
  const handleCurrencySelectA = (currency: Currency) => {
    if (currency === currencyB) {
      swapCurrencies()
    } else {
      setCurrencyA(currency)
    }
  }
  const handleCurrencySelectB = (currency: Currency) => {
    if (currency === currencyA) {
      swapCurrencies()
    } else {
      setCurrencyB(currency)
    }
  }
  const { mixpanelHandler } = useMixpanel()

  const handleSubmit = () => {
    if (!touched) {
      setTouched(true)
    }
    if (isValidAddress && (!isShowTokens || (isShowTokens && currencyA && currencyB))) {
      mixpanelHandler(MIXPANEL_TYPE.CREATE_REFERRAL_CLICKED, {
        referral_commission: commission,
        input_token: currencyA && currencyA.symbol,
        output_token: currencyB && currencyB.symbol,
      })
      setIsShowShareLinkModal(true)
      setTouched(false)
    }
  }

  useEffect(() => {
    setCurrencyA(undefined)
    setCurrencyB(undefined)
  }, [chainId])

  return (
    <PageWrapper>
      <BodyWrapper>
        <Text fontSize={20} marginBottom="20px" textAlign="center" fontWeight={500}>
          <Trans>Create a Referral Link</Trans>
        </Text>
        {above1000 && <Divider marginBottom="20px" />}
        <Flex justifyContent="space-around" alignItems="stretch" flexDirection={above1000 ? 'row' : 'column'}>
          <Flex flexDirection="column" flex={1}>
            <AboutDropdown>
              {/* <Flex
                justifyContent="space-between"
                alignItems="center"
                onClick={() => setIsShowAbout(prev => !prev)}
                style={{ cursor: 'pointer' }}
              >
                <Text>
                  <Trans>About</Trans>
                </Text>
                {isShowAbout ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </Flex> */}
              {/* {isShowAbout && (
                <>
                  <Divider margin={'10px 0'} /> */}
              <Text fontSize={12} lineHeight={'20px'}>
                <Trans>
                  You can create referral links here. If your referral link is used by anyone during a trade, you will
                  receive a small commission from their transaction. The commission will be instantly sent to your
                  wallet address. You can create multiple referral links with different configurations.
                  <br />
                  <br />
                  Read more{' '}
                  <a
                    href="https://docs.kyberswap.com/guides/referral-fee-program/index.html"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    here
                  </a>
                </Trans>
              </Text>
              {/* </>
              )} */}
            </AboutDropdown>

            <Text fontSize={12} color={theme.disableText} textAlign="right" marginBottom="8px" fontStyle="italic">
              <Trans>*Required</Trans>
            </Text>
            <AddressBox
              style={{
                marginBottom: !above1000 ? '24px' : '',
                border: !isValidAddress && touched ? `1px solid ${theme.red}` : undefined,
              }}
            >
              <Text fontSize={12} color={theme.subText} marginBottom="8px">
                <Trans>Your wallet address *</Trans>
                <InfoHelper
                  size={12}
                  text={t`Any referral commission will automatically be sent to this wallet address`}
                  placement="top"
                />
              </Text>
              <Text fontSize={20} lineHeight={'24px'} color={theme.text}>
                <AddressInput
                  type="text"
                  value={address}
                  onChange={(e: any) => {
                    setAddress(e.target.value)
                  }}
                />
              </Text>
            </AddressBox>
            {!isValidAddress && touched && (
              <ErrorMessage>
                <Trans>Address is not valid</Trans>
              </ErrorMessage>
            )}
          </Flex>
          <VerticalDivider style={{ height: 'auto', margin: ' 0 32px' }} />
          <Flex flex={1} flexDirection="column">
            <ReferralCommissionBox>
              <Text fontSize={12} lineHeight="16px" color={theme.subText} marginBottom="10px">
                <Trans>Referral Commission</Trans> (%) *{' '}
                <InfoHelper
                  size={12}
                  text={t`Commission (%) that is applied to each successful trade that uses your referral link`}
                  placement="top"
                />
              </Text>
              <Flex justifyContent="space-between" alignItems="center">
                <Text fontSize={36} lineHeight="42px" fontWeight={500} color={theme.text}>
                  {new Fraction(JSBI.BigInt(commission), JSBI.BigInt(PERCENT_TO_BIP_DENOMINATOR)).toSignificant(5)}%
                </Text>
                <MaxButton onClick={() => setCommission(100)}>
                  <Text fontSize={12} color={theme.green}>
                    <Trans>Max</Trans>: 0.1%
                  </Text>
                </MaxButton>
              </Flex>
              <CommissionSlider
                value={commission}
                min={1} // Equals 0.01%
                max={10} // Equals 0.1%
                step={1}
                onChange={value => setCommission(value)}
                size={16}
                style={{ width: '100%' }}
              />
            </ReferralCommissionBox>
            <Flex marginBottom="12px" justifyContent="space-between">
              <Text fontSize={16} lineHeight="20px" color={theme.text}>
                <Trans>Include Chain</Trans>
                <InfoHelper
                  placement="top"
                  size={12}
                  text={t`You can include the chain in your referral link so referees are automatically re-directed to this network on KyberSwap. You will still earn commission on trades that are made on other chains and use your referral link`}
                  width="300px"
                />
              </Text>
              <FilterBarToggle isActive={isShowChain} toggle={() => setIsShowChain(prev => !prev)} />
            </Flex>
            {isShowChain && (
              <>
                <NetworkSelect onClick={() => toggleNetworkModal()}>
                  {chainId && (
                    <>
                      <Flex alignItems="center">
                        <img
                          alt=""
                          src={NETWORK_ICON[chainId]}
                          style={{ height: '20px', width: '20px', marginRight: '8px' }}
                        />
                        {NETWORK_LABEL[chainId]}
                      </Flex>
                      <ChevronDown size={20} style={{ top: '10px', right: '10px', position: 'absolute' }} />
                    </>
                  )}
                </NetworkSelect>
                <Flex marginBottom={isShowTokens ? '12px' : '28px'} justifyContent="space-between">
                  <Text fontSize={16} lineHeight="20px" color={theme.text}>
                    <Trans>Include Tokens</Trans>
                    <InfoHelper
                      placement="top"
                      size={12}
                      text={t`You can also include tokens to swap in your referral link so that referees are automatically re-directed to selected chain and selected tokens are also populated for the swap. You will still earn commission on other token swaps if they use your referral link.`}
                      width="300px"
                    />
                  </Text>
                  <FilterBarToggle isActive={isShowTokens} toggle={() => setIsShowTokens(prev => !prev)} />
                </Flex>
                {isShowTokens && (
                  <Flex alignItems="flex-start" marginBottom="28px">
                    <Flex flexDirection="column" flex={1}>
                      <Label>
                        <Trans>Input Token</Trans> *
                      </Label>
                      <TokensSelect
                        currency={currencyA}
                        onCurrencySelect={handleCurrencySelectA}
                        onRemoveSelect={() => setCurrencyA(undefined)}
                        otherSelectedCurrency={currencyB}
                        style={{ border: !currencyA && touched ? `1px solid ${theme.red}` : undefined }}
                      />
                      {!currencyA && touched && (
                        <ErrorMessage>
                          <Trans>Please select a token</Trans>
                        </ErrorMessage>
                      )}
                    </Flex>
                    <ArrowRight style={{ margin: '30px 14px 0px 14px', alignSelf: 'flex-start' }} />
                    <Flex flexDirection="column" flex={1}>
                      <Label>
                        <Trans>Output Token</Trans> *
                      </Label>
                      <TokensSelect
                        currency={currencyB}
                        onCurrencySelect={handleCurrencySelectB}
                        onRemoveSelect={() => setCurrencyB(undefined)}
                        otherSelectedCurrency={currencyA}
                        style={{ border: !currencyB && touched ? `1px solid ${theme.red}` : undefined }}
                      />
                      {!currencyB && touched && (
                        <ErrorMessage>
                          <Trans>Please select a token</Trans>
                        </ErrorMessage>
                      )}
                    </Flex>
                  </Flex>
                )}
              </>
            )}
            <ButtonPrimary onClick={handleSubmit} style={{ marginTop: 'auto' }}>
              <Trans>Create Your Referral Link</Trans>
            </ButtonPrimary>
          </Flex>
        </Flex>
      </BodyWrapper>
      <NetworkModal />
      <ShareLinkModal
        isOpen={isShowShareLinkModal}
        onDismiss={() => setIsShowShareLinkModal(false)}
        shareUrl={shareUrl}
      />
    </PageWrapper>
  )
}
