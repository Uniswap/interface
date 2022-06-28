import { useBottomSheetModal } from '@gorhom/bottom-sheet'
import { AnyAction } from '@reduxjs/toolkit'
import { Currency } from '@uniswap/sdk-core'
import { notificationAsync } from 'expo-haptics'
import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { TransferArrowButton } from 'src/components/buttons/TransferArrowButton'
import { CurrencyInputPanel } from 'src/components/input/CurrencyInputPanel'
import { DecimalPad } from 'src/components/input/DecimalPad'
import { RecipientInputPanel } from 'src/components/input/RecipientInputPanel'
import { Flex } from 'src/components/layout'
import { NFTAssetItem } from 'src/components/NFT/NFTAssetItem'
import { AssetType } from 'src/entities/assets'
import { NFTAsset } from 'src/features/nfts/types'
import { ElementName } from 'src/features/telemetry/constants'
import { useSwapActionHandlers } from 'src/features/transactions/swap/hooks'
import {
  CurrencyField,
  TransactionState,
} from 'src/features/transactions/transactionState/transactionState'
import {
  useDerivedTransferInfo,
  useTransferERC20Callback,
  useTransferNFTCallback,
} from 'src/features/transactions/transfer/hooks'
import { dimensions } from 'src/styles/sizing'
import { currencyAddress } from 'src/utils/currencyId'

interface TransferTokenProps {
  state: TransactionState
  dispatch: React.Dispatch<AnyAction>
}

export function TransferTokenForm({ state, dispatch }: TransferTokenProps) {
  const { t } = useTranslation()
  const { dismiss } = useBottomSheetModal()

  const onSubmit = useCallback(() => {
    dismiss()
  }, [dismiss])

  const derivedTransferInfo = useDerivedTransferInfo(state)
  const {
    currencies,
    currencyAmounts,
    currencyBalances,
    currencyTypes,
    formattedAmounts,
    recipient,
  } = derivedTransferInfo

  const { onSelectCurrency, onUpdateExactTokenAmount, onSelectRecipient } =
    useSwapActionHandlers(dispatch)

  // TODO: consider simplifying this logic
  const isNFT =
    currencyTypes[CurrencyField.INPUT] === AssetType.ERC721 ||
    currencyTypes[CurrencyField.INPUT] === AssetType.ERC1155
  const currencyIn = !isNFT ? (currencies[CurrencyField.INPUT] as Currency) : undefined
  const nftIn = isNFT ? (currencies[CurrencyField.INPUT] as NFTAsset.Asset) : undefined

  const transferERC20Callback = useTransferERC20Callback(
    currencyIn?.chainId,
    recipient,
    currencyIn ? currencyAddress(currencyIn) : undefined,
    currencyAmounts[CurrencyField.INPUT]?.quotient.toString(),
    onSubmit
  )
  // TODO: if readonly account, not sendable
  const transferNFTCallback = useTransferNFTCallback(
    nftIn?.chainId,
    recipient,
    nftIn?.asset_contract.address,
    nftIn?.token_id,
    onSubmit
  )

  return (
    <Flex grow justifyContent="space-between" p="md">
      <Flex grow gap="md" justifyContent="center">
        {isNFT ? (
          <Flex centered>
            <NFTAssetItem nft={nftIn} size={dimensions.fullWidth / 1.5} />
          </Flex>
        ) : (
          <CurrencyInputPanel
            autoFocus
            currency={currencyIn}
            currencyAmount={currencyAmounts[CurrencyField.INPUT]}
            currencyBalance={currencyBalances[CurrencyField.INPUT]}
            value={formattedAmounts[CurrencyField.INPUT]}
            onSelectCurrency={(newCurrency: Currency) =>
              onSelectCurrency(CurrencyField.INPUT, newCurrency)
            }
            // TODO: enable USD inputs in transfer token form
            onSetAmount={(value) => onUpdateExactTokenAmount(CurrencyField.INPUT, value)}
          />
        )}

        <TransferArrowButton disabled />

        <RecipientInputPanel recipientAddress={recipient} setRecipientAddress={onSelectRecipient} />
      </Flex>

      {isNFT ? null : (
        <DecimalPad
          setValue={(newValue) => onUpdateExactTokenAmount(CurrencyField.INPUT, newValue)}
          value={formattedAmounts[CurrencyField.INPUT]}
        />
      )}

      <PrimaryButton
        disabled={false}
        label={t('Send')}
        name={ElementName.Submit}
        py="md"
        textVariant="largeLabel"
        onPress={() => {
          notificationAsync()
          isNFT ? transferNFTCallback?.() : transferERC20Callback?.()
        }}
      />
    </Flex>
  )
}
