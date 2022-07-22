import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { default as React, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SearchTextInput } from 'src/components/input/SearchTextInput'
import { Flex } from 'src/components/layout'
import { filterRecipientByNameAndAddress } from 'src/components/RecipientSelect/filter'
import { useRecipientHasZeroBalances, useRecipients } from 'src/components/RecipientSelect/hooks'
import { RecipientList, RecipientLoadingRow } from 'src/components/RecipientSelect/RecipientList'
import { filterSections } from 'src/components/RecipientSelect/utils'
import { Text } from 'src/components/Text'
import { WarningAction, WarningLabel, WarningSeverity } from 'src/components/warnings/types'
import { WarningModal } from 'src/components/warnings/WarningModal'
import { ChainId, CHAIN_INFO } from 'src/constants/chains'

interface RecipientSelectProps {
  setRecipientAddress: (newRecipientAddress: string) => void
  chainId: ChainId
}

// TODO:
// - change search bar icon to pressable scan
// - add new address warning modal
export function RecipientSelect({ setRecipientAddress, chainId }: RecipientSelectProps) {
  const { t } = useTranslation()
  const [showWarningModal, setShowWarningModal] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState<string>('')

  const networkName = CHAIN_INFO[chainId].label

  const { sections, searchableRecipientOptions, pattern, onChangePattern, loading } =
    useRecipients()

  const { recipientHasZeroBalances, balancesLoading } = useRecipientHasZeroBalances(
    selectedAddress,
    chainId
  )

  useEffect(() => {
    if (!selectedAddress || balancesLoading) {
      return
    }

    // surface warning if address selected has zero balances
    if (recipientHasZeroBalances) setShowWarningModal(true)
    // otherwise, usual behavior: address gets selected and return to transfer page
    else setRecipientAddress(selectedAddress)
  }, [selectedAddress, recipientHasZeroBalances, setRecipientAddress, balancesLoading])

  const filteredSections = useMemo(() => {
    const filteredAddresses = filterRecipientByNameAndAddress(
      pattern,
      searchableRecipientOptions
    ).map((item) => item.data.address)
    return filterSections(sections, filteredAddresses)
  }, [pattern, searchableRecipientOptions, sections])

  const noResults = pattern && pattern?.length > 0 && !loading && filteredSections.length === 0

  return (
    // We need this provider otherwise the modal opens behind the recipient select screen and isn't visible
    <BottomSheetModalProvider>
      <Flex px="md">
        {showWarningModal && (
          <WarningModal
            data={selectedAddress}
            warning={{
              type: WarningLabel.RecipientZeroBalances,
              severity: WarningSeverity.Medium,
              action: WarningAction.WarnBeforeSubmit,
              title: t('No token balances on {{ network }}', { network: networkName }),
              message: t(
                "The address you selected doesn't have any tokens in its wallet on {{ network }}. Please confirm that the address and network are corect before continuing.",
                { network: networkName }
              ),
            }}
            onClose={() => setShowWarningModal(false)}
            onPressCancel={() => setSelectedAddress('')}
            onPressContinue={() => setRecipientAddress(selectedAddress)}
          />
        )}
        <Flex>
          <Flex row alignItems="center" gap="sm">
            <SearchTextInput
              showBackButton
              placeholder={t('Input address or ENS')}
              value={pattern}
              onChangeText={onChangePattern}
            />
          </Flex>
          {loading && <RecipientLoadingRow />}
          {noResults ? (
            <Flex centered gap="sm" mt="lg" px="lg">
              <Text variant="mediumLabel">😔</Text>
              <Text variant="mediumLabel">{t('No results found')}</Text>
              <Text color="textTertiary" textAlign="center" variant="body">
                {t('The address you typed either does not exist or is spelled incorrectly.')}
              </Text>
            </Flex>
          ) : (
            // Show either suggested recipients or filtered sections based on query
            <RecipientList
              sections={filteredSections.length === 0 ? sections : filteredSections}
              onPress={setSelectedAddress}
            />
          )}
        </Flex>
      </Flex>
    </BottomSheetModalProvider>
  )
}
