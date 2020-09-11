import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Text } from 'rebass'
import { ButtonPrimary } from '../../components/Button'
import { AutoColumn } from '../../components/Column'
import CROInputField from '../../components/CROInputField'
import { StakeTabs } from '../../components/NavigationTabs'
import Select from '../../components/Select'
import StakeModal from '../../components/Stake/StakeModal'
import CRO_TOKEN from '../../constants/croToken'
import { Field, StakeContractAddress } from '../../constants/stakeContractAddress'
import { useActiveWeb3React } from '../../hooks'
import { useCurrencyBalance } from '../../state/wallet/hooks'
import { maxAmountSpend } from '../../utils/maxAmountSpend'
import AppBody from '../AppBody'

const BoostTab = () => {
  const { t } = useTranslation()
  const { account } = useActiveWeb3React()
  const selectedCurrencyBalance = useCurrencyBalance(account || undefined, CRO_TOKEN)
  const maxAmount = maxAmountSpend(selectedCurrencyBalance)
  const [isOpen, setIsOpen] = useState(false)
  const [yearStake, setYearStake] = useState(Field.TWO_YEAR)
  const [stakeAmount, setStakeAmount] = useState('1000')

  function onStakeChange(value: string) {
    setYearStake(value as Field)
  }

  function onDismiss() {
    setIsOpen(false)
    setStakeAmount('')
  }

  function onStakeClick(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    e.preventDefault()
    setIsOpen(true)
  }

  function onUserInput(val: string) {
    if (!val || val.match(/^\d{1,12}(\.\d{0,8})?$/)) {
      setStakeAmount(val)
    }
  }

  const lessThanMinimumStake = parseFloat(stakeAmount) < 1000

  return (
    <>
      <AppBody>
        <StakeTabs />
        <StakeModal isOpen={isOpen} onDismiss={onDismiss} yearStake={yearStake} stakeAmount={stakeAmount} />
        <AutoColumn gap="lg">
          <CROInputField
            label={t('stake_input_stake_amount')}
            showMaxButton
            currency={CRO_TOKEN}
            value={stakeAmount}
            onUserInput={onUserInput}
            onMax={() => setStakeAmount(maxAmount?.toSignificant(6).toString() || '0')}
            id="stake-currency-input"
            currencyLogoUrl="https://crypto.com/price/coin-data/icon/CRO/color_icon.png"
          />

          <Select
            id="select_stake_page_stake_period"
            options={Object.keys(StakeContractAddress)}
            label={t('stake_page_stake_period')}
            onChange={onStakeChange}
            defaultValue={Field.TWO_YEAR}
          />

          <ButtonPrimary
            id="boost-btn-add-stake"
            style={{ padding: 16 }}
            onClick={onStakeClick}
            disabled={
              !stakeAmount ||
              lessThanMinimumStake ||
              parseFloat(stakeAmount) === 0 ||
              parseFloat(stakeAmount) > parseFloat(maxAmount?.toSignificant(6) || '0')
            }
          >
            {lessThanMinimumStake ? (
              <Text fontWeight={500} fontSize={16}>
                Your CRO DeFi Yield multiplier will be 0 if you stake less than 1000 CRO
              </Text>
            ) : (
              <Text fontWeight={500} fontSize={20}>
                {t('stake_btn_review_stake')}
              </Text>
            )}
          </ButtonPrimary>
        </AutoColumn>
      </AppBody>
    </>
  )
}

export default BoostTab
