import { useContractKit, useGetConnectedSigner } from '@celo-tools/use-contractkit'
import { Token } from '@ubeswap/sdk'
import AddressInputPanel from 'components/AddressInputPanel'
import { ButtonLight, ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import CurrencyLogo from 'components/CurrencyLogo'
import { CardNoise, CardSection, DataCard } from 'components/earn/styled'
import Loader from 'components/Loader'
import { AutoRow, RowBetween } from 'components/Row'
import ChainSearchModal, { Chain, chains } from 'components/SearchModal/ChainSearchModal'
import { useDoTransaction } from 'components/swap/routing'
import SwapHeader from 'components/swap/SwapHeader'
import { ethers } from 'ethers'
import { BridgeRouter__factory } from 'generated/factories/BridgeRouter__factory'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import { BodyWrapper } from 'pages/AppBody'
import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { tryParseAmount } from 'state/swap/hooks'
import { useCurrencyBalance } from 'state/wallet/hooks'
import styled from 'styled-components'
import { ExternalLink, TYPE } from 'theme'
import { isAddress } from 'web3-utils'

import { ReactComponent as DropDown } from '../../assets/images/dropdown.svg'

const TopSection = styled(AutoColumn)({
  maxWidth: '480px',
  width: '100%',
})

const Wrapper = styled.div({
  margin: '0px 24px',
})

const Label = styled.div({
  margin: '24px 0px 8px 0px',
})

const ChainSelect = styled.div({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 64px',
  border: '1px solid rgba(255, 255, 255, 0.4)',
  cursor: 'pointer',
  borderRadius: '20px',
  ':hover': {
    opacity: 0.7,
  },
})

export const Bridge: React.FC = () => {
  const { t } = useTranslation()
  const { address, network, updateNetwork, connect } = useContractKit()
  const getConnectedSigner = useGetConnectedSigner()
  const [homeChain, setHomeChain] = useState<Chain>(chains[0])
  const [destChain, setDestChain] = useState<Chain>(chains[1])
  const [selectingHomeChain, setSelectingHomeChain] = useState(false)
  const [selectingDestChain, setSelectingDestChain] = useState(false)
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState<Token>(homeChain.token)
  const tokenAmount = tryParseAmount(amount === '' ? '0' : amount, currency)
  const [approvalState, approve] = useApproveCallback(tokenAmount, homeChain.bridgeRouter)
  const selectedCurrencyBalance = useCurrencyBalance(address ?? undefined, currency)
  useEffect(() => {
    setCurrency(homeChain.token)
  }, [homeChain])
  const [recipient, setRecipient] = useState('')
  const correctNetwork = homeChain.network === network
  const doTransaction = useDoTransaction()
  const onBridgeClick = useCallback(async () => {
    const bridgeRouter = BridgeRouter__factory.connect(homeChain.bridgeRouter, await getConnectedSigner())
    if (!tokenAmount) {
      return
    }
    return await doTransaction(bridgeRouter, 'send', {
      args: [currency.address, tokenAmount.raw.toString(), destChain.domain, ethers.utils.hexZeroPad(recipient, 32)],
      summary: `Bridge ${amount} ${currency.symbol} from ${homeChain.prettyName} to ${destChain.prettyName}`,
    })
  }, [doTransaction, currency, amount, homeChain, destChain, recipient, getConnectedSigner, tokenAmount])

  let button = <ButtonLight onClick={() => connect().catch(console.warn)}>{t('connectWallet')}</ButtonLight>
  if (address) {
    if (!correctNetwork) {
      button = (
        <ButtonLight
          onClick={() =>
            connect()
              .then(() => updateNetwork(homeChain.network))
              .catch(console.warn)
          }
        >
          {t('changeNetwork')} {homeChain.prettyName}
        </ButtonLight>
      )
    } else if (approvalState !== ApprovalState.APPROVED) {
      button = (
        <ButtonPrimary
          onClick={() => approve().catch(console.error)}
          disabled={!tokenAmount}
          altDisabledStyle={approvalState === ApprovalState.PENDING} // show solid button while waiting
        >
          {approvalState === ApprovalState.PENDING ? (
            <AutoRow gap="6px" justify="center">
              Approving <Loader stroke="white" />
            </AutoRow>
          ) : (
            'Approve ' + currency.symbol
          )}
        </ButtonPrimary>
      )
    } else {
      button = (
        <ButtonPrimary onClick={onBridgeClick} disabled={!isAddress(recipient)}>
          {t('bridge')}
        </ButtonPrimary>
      )
    }
  }

  return (
    <>
      <TopSection gap="md">
        <DataCard style={{ marginBottom: '32px' }}>
          <CardNoise />
          <CardSection>
            <AutoColumn gap="md">
              <RowBetween>
                <TYPE.white fontWeight={600}>Optics {t('bridge')}</TYPE.white>
              </RowBetween>
              <RowBetween>
                <TYPE.white fontSize={14}>{t('bridgeDesc')}</TYPE.white>
              </RowBetween>{' '}
              <ExternalLink
                style={{ color: 'white', textDecoration: 'underline' }}
                href="https://docs.celo.org/celo-codebase/protocol/optics"
                target="_blank"
              >
                <TYPE.white fontSize={14}>{t('bridgeReadMore')}</TYPE.white>
              </ExternalLink>
            </AutoColumn>
          </CardSection>
          <CardNoise />
        </DataCard>
      </TopSection>
      <BodyWrapper>
        <div style={{ marginTop: '8px' }}>
          <SwapHeader title={t('bridge')} hideSettings />
        </div>
        <Wrapper>
          <Label>Home chain</Label>
          <ChainSelect onClick={() => setSelectingHomeChain(true)}>
            <CurrencyLogo currency={homeChain.token} />
            <span>{homeChain.prettyName}</span>
            <DropDown />
          </ChainSelect>
          <Label>Destination chain</Label>
          <ChainSelect onClick={() => setSelectingDestChain(true)}>
            <CurrencyLogo currency={destChain.token} />
            <span>{destChain.prettyName}</span>
            <DropDown />
          </ChainSelect>
          <div style={{ margin: '16px 0px' }}>
            <CurrencyInputPanel
              value={amount}
              onUserInput={setAmount}
              label={t('amount')}
              showMaxButton
              onMax={() => selectedCurrencyBalance && setAmount(selectedCurrencyBalance.toSignificant(6))}
              currency={currency}
              onCurrencySelect={setCurrency}
              disableCurrencySelect={!correctNetwork}
              id="bridge-currency"
            />
          </div>
          <div style={{ margin: '16px 0px' }}>
            <AddressInputPanel value={recipient} onChange={setRecipient} />
          </div>
          <div style={{ marginBottom: '16px' }}>{button}</div>
        </Wrapper>
        <ChainSearchModal
          isOpen={selectingHomeChain}
          onDismiss={() => setSelectingHomeChain(false)}
          onChainSelect={(chain) => setHomeChain(chain)}
        />
        <ChainSearchModal
          isOpen={selectingDestChain}
          onDismiss={() => setSelectingDestChain(false)}
          onChainSelect={(chain) => setDestChain(chain)}
        />
      </BodyWrapper>
    </>
  )
}
