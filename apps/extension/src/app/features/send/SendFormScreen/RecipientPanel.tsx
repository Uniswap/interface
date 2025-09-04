import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Separator, Text, TouchableArea } from 'ui/src'
import { RotatableChevron, WalletFilled } from 'ui/src/components/icons'
import { iconSizes, spacing } from 'ui/src/theme'
import { AddressDisplay } from 'uniswap/src/components/accounts/AddressDisplay'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { SearchTextInput } from 'uniswap/src/features/search/SearchTextInput'
import { useFilteredRecipientSections } from 'wallet/src/components/RecipientSearch/hooks'
import { RecipientList } from 'wallet/src/components/RecipientSearch/RecipientList'
import { RecipientSelectSpeedBumps } from 'wallet/src/components/RecipientSearch/RecipientSelectSpeedBumps'
import { useSendContext } from 'wallet/src/features/transactions/contexts/SendContext'

type RecipientPanelProps = {
  chainId?: UniverseChainId
}

export function RecipientPanel({ chainId }: RecipientPanelProps): JSX.Element {
  const { t } = useTranslation()

  const [pattern, setPattern] = useState('')
  const [selectedRecipient, setSelectedRecipient] = useState<string | undefined>()
  const [checkSpeedBumps, setCheckSpeedBumps] = useState(false)

  const { recipient, showRecipientSelector, updateSendForm } = useSendContext()

  const onSetShowRecipientSelector = useCallback(
    (show: boolean) => {
      updateSendForm({ showRecipientSelector: show })
    },
    [updateSendForm],
  )

  const onToggleShowRecipientSelector = useCallback(() => {
    onSetShowRecipientSelector(!showRecipientSelector)
  }, [onSetShowRecipientSelector, showRecipientSelector])

  const { sections } = useFilteredRecipientSections(pattern)

  const onSelectRecipient = useCallback((newRecipient: string) => {
    setSelectedRecipient(newRecipient)
    setCheckSpeedBumps(true)
  }, [])

  const onSpeedBumpConfirm = useCallback(() => {
    if (!selectedRecipient) {
      return
    }
    updateSendForm({ recipient: selectedRecipient })
    onSetShowRecipientSelector(false)
  }, [selectedRecipient, updateSendForm, onSetShowRecipientSelector])

  const onClose = (): void => {
    updateSendForm({ showRecipientSelector: false })
  }

  const noPatternOrFavorites = !pattern && sections.length === 0

  return showRecipientSelector || !recipient ? (
    <Flex gap="$spacing12">
      <Flex gap="$none">
        <Text color="$neutral2" variant="body3">
          {t('common.text.recipient')}
        </Text>
        <Flex centered row pb="$spacing4">
          <Flex grow>
            <SearchTextInput
              autoFocus={showRecipientSelector || !recipient} // Only auto focus if panel is expanded
              backgroundColor="transparent"
              hideIcon={true}
              minHeight={spacing.spacing36}
              placeholder={t('send.search.placeholder')}
              px="$none"
              py="$none"
              value={pattern}
              onChangeText={setPattern}
              onFocus={() => onSetShowRecipientSelector(true)}
            />
          </Flex>
          {showRecipientSelector && (
            <TouchableArea onPress={onClose}>
              <RotatableChevron
                color="$neutral3"
                direction="up"
                flexShrink={1}
                height={iconSizes.icon20}
                width={iconSizes.icon20}
              />
            </TouchableArea>
          )}
        </Flex>
        {showRecipientSelector && <Separator />}
      </Flex>
      {showRecipientSelector &&
        (noPatternOrFavorites ? (
          <Flex centered gap="$spacing12" mt="$spacing48" px="$spacing12">
            <WalletFilled color="$neutral3" size="$icon.40" />
            <Flex centered gap="$spacing8">
              <Text variant="subheading2">{t('send.recipientSelect.search.empty.title')}</Text>
              <Text color="$neutral3" textAlign="center" variant="body3">
                {t('send.recipientSelect.search.empty.message')}
              </Text>
            </Flex>
          </Flex>
        ) : !sections.length ? (
          <Flex centered gap="$spacing12" mt="$spacing24" px="$spacing24">
            <Text variant="buttonLabel1">{t('send.search.empty.title')}</Text>
            <Text color="$neutral3" textAlign="center" variant="body1">
              {t('send.search.empty.subtitle')}
            </Text>
          </Flex>
        ) : (
          // Show either suggested recipients or filtered sections based on query
          <RecipientList sections={sections} onPress={onSelectRecipient} />
        ))}
      <RecipientSelectSpeedBumps
        chainId={chainId}
        checkSpeedBumps={checkSpeedBumps}
        recipientAddress={selectedRecipient}
        setCheckSpeedBumps={setCheckSpeedBumps}
        onConfirm={onSpeedBumpConfirm}
      />
    </Flex>
  ) : (
    <TouchableArea onPress={onToggleShowRecipientSelector}>
      <Flex centered row justifyContent="space-between">
        <AddressDisplay address={recipient} size={iconSizes.icon36} />
        <RotatableChevron color="$neutral3" direction="down" height={iconSizes.icon20} width={iconSizes.icon20} />
      </Flex>
    </TouchableArea>
  )
}
