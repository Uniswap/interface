import { getAddress } from '@ethersproject/address'
import { ButtonError } from 'components/Button'
import { LightCard } from 'components/Card'
import { SearchInput } from 'components/SearchModal/styleds'
import { useCustomStakingInfo } from 'pages/Earn/useCustomStakingInfo'
import { FarmSummary } from 'pages/Earn/useFarmRegistry'
import React, { RefObject, useContext, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Text } from 'rebass'
import styled, { ThemeContext } from 'styled-components'
import { isAddress } from 'web3-utils'

import { BIG_INT_SECONDS_IN_WEEK, IMPORTED_FARMS } from '../../constants'
import { CloseIcon, TYPE } from '../../theme'
import { AutoColumn } from '../Column'
import Modal from '../Modal'
import Row, { RowBetween } from '../Row'

const ContentWrapper = styled(AutoColumn)`
  width: 100%;
  flex: 1 1;
  position: relative;
  padding: 1rem;
`

interface ImportFarmModalProps {
  isOpen: boolean
  onDismiss: () => void
  farmSummaries: FarmSummary[]
}

export default function ImportFarmModal({ isOpen, onDismiss, farmSummaries }: ImportFarmModalProps) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>()
  const theme = useContext(ThemeContext)
  const [farmAddress, setFarmAddress] = useState<string>('')
  const { stakingToken, rewardTokens, totalRewardRates, valueOfTotalStakedAmountInCUSD } =
    useCustomStakingInfo(farmAddress)
  const [error, setError] = useState<string | undefined>(undefined)

  const farmExists = isAddress(farmAddress)
    ? farmSummaries.find(
        (farmSummary) => farmAddress && getAddress(farmSummary.stakingAddress) === getAddress(farmAddress)
      )
    : undefined

  const importedFarms = localStorage.getItem(IMPORTED_FARMS)

  const handleInput = (event: any) => {
    const input = event.target.value
    setFarmAddress(input)
  }

  useEffect(() => {
    if (isAddress(farmAddress)) {
      const res = importedFarms
        ? JSON.parse(importedFarms).find((item: string) => getAddress(item) === getAddress(farmAddress))
        : undefined
      setError(res ? t('TheFarmHasAlreadyBeenImported') : undefined)
    } else {
      if (farmAddress.length > 0) {
        setError(t('EnterValidFarmAddress'))
      } else {
        setError(undefined)
      }
    }
  }, [farmAddress, importedFarms, t])

  const onConfirm = () => {
    try {
      localStorage.setItem(
        IMPORTED_FARMS,
        JSON.stringify(importedFarms ? JSON.parse(importedFarms).concat(farmAddress) : [farmAddress])
      )
    } catch (e) {
      console.error(e)
      localStorage.setItem(IMPORTED_FARMS, '')
    }
    setFarmAddress('')
    onDismiss()
  }

  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} maxHeight={90}>
      <ContentWrapper gap={'12px'}>
        <AutoColumn gap="12px">
          <RowBetween>
            <Text fontWeight={500} fontSize={16}>
              {t('ImportFarm')}
            </Text>
            <CloseIcon onClick={onDismiss} />
          </RowBetween>
          <Row>
            <SearchInput
              type="text"
              id="token-search-input"
              placeholder={t('EnterFarmAddress')}
              autoComplete="off"
              value={farmAddress}
              ref={inputRef as RefObject<HTMLInputElement>}
              onChange={handleInput}
            />
          </Row>
        </AutoColumn>
        <LightCard padding="1rem" borderRadius={'16px'}>
          <AutoColumn gap={'14px'}>
            <AutoColumn justify="space-between">
              <RowBetween>
                <TYPE.black>Staking Token</TYPE.black>
                <Text fontWeight={500} fontSize={14} color={theme.text2} pt={1}>
                  {stakingToken ? stakingToken?.symbol : '-'}
                </Text>
              </RowBetween>
            </AutoColumn>
            <AutoColumn justify="center">
              <RowBetween>
                <TYPE.black>Total Deposits</TYPE.black>
                <Text fontWeight={500} fontSize={14} color={theme.text2} pt={1}>
                  {valueOfTotalStakedAmountInCUSD
                    ? Number(valueOfTotalStakedAmountInCUSD).toLocaleString(undefined, {
                        style: 'currency',
                        currency: 'USD',
                        maximumFractionDigits: 0,
                      })
                    : '-'}
                </Text>
              </RowBetween>
            </AutoColumn>
            <AutoColumn justify="center">
              <RowBetween align={'start'}>
                <TYPE.black>Pool Rate</TYPE.black>
                <AutoColumn justify="end">
                  {totalRewardRates && rewardTokens && totalRewardRates.length ? (
                    totalRewardRates.map((data, index) => (
                      <Text key={index} fontWeight={500} fontSize={14} color={theme.text2} pt={1}>
                        {data
                          ? data.multiply(BIG_INT_SECONDS_IN_WEEK)?.toSignificant(4, { groupSeparator: ',' }) +
                            ' ' +
                            rewardTokens[index].symbol +
                            ' / Week'
                          : '-'}
                      </Text>
                    ))
                  ) : (
                    <Text>-</Text>
                  )}
                </AutoColumn>
              </RowBetween>
            </AutoColumn>
          </AutoColumn>
        </LightCard>
        <ButtonError
          disabled={
            !!error ||
            !!farmExists ||
            !valueOfTotalStakedAmountInCUSD ||
            !rewardTokens ||
            !totalRewardRates ||
            !stakingToken
          }
          onClick={onConfirm}
        >
          {error ? error : farmExists ? t('TheFarmAlreadyExists') : t('ImportFarm')}
        </ButtonError>
      </ContentWrapper>
    </Modal>
  )
}
