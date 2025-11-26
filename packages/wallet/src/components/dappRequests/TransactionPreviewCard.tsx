import { type ReactNode, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea } from 'ui/src'
import { ContractInteraction, RotatableChevron } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useBooleanState } from 'utilities/src/react/useBooleanState'
import { TransactionApprovingSection } from 'wallet/src/components/dappRequests/TransactionApprovingSection'
import {
  TransactionErrorSection,
  TransactionErrorType,
} from 'wallet/src/components/dappRequests/TransactionErrorSection'
import { TransactionReceivingSection } from 'wallet/src/components/dappRequests/TransactionReceivingSection'
import { TransactionRequestDetails } from 'wallet/src/components/dappRequests/TransactionRequestDetails'
import { TransactionSendingSection } from 'wallet/src/components/dappRequests/TransactionSendingSection'
import {
  TransactionRiskLevel,
  TransactionSection,
  TransactionSectionType,
} from 'wallet/src/features/dappRequests/types'

interface TransactionPreviewCardProps {
  sections?: TransactionSection[]
  riskLevel: TransactionRiskLevel
  // Transaction details
  functionName?: string
  contractName?: string
  contractAddress?: string
  rawData?: string
  chainId: UniverseChainId
  errorType?: TransactionErrorType
  // Custom content for signatures or other use cases
  children?: ReactNode
}

export function TransactionPreviewCard({
  sections = [],
  riskLevel,
  functionName,
  contractName,
  contractAddress,
  rawData,
  chainId,
  errorType,
  children,
}: TransactionPreviewCardProps): JSX.Element {
  const { t } = useTranslation()

  // State management - auto-expands when errorType is present
  const { value: isDetailsExpanded, toggle: toggleDetails, setTrue: expandDetails } = useBooleanState(false)

  // Track if we've already auto-expanded for an error
  const hasAutoExpandedRef = useRef(false)

  // Auto-expand details when error first appears
  useEffect(() => {
    if (errorType && !hasAutoExpandedRef.current) {
      expandDetails()
      hasAutoExpandedRef.current = true
    }
  }, [errorType, expandDetails])

  // Determine border color based on risk level
  const borderColor = useMemo(
    () =>
      riskLevel === TransactionRiskLevel.Critical
        ? '$statusCritical'
        : riskLevel === TransactionRiskLevel.Warning
          ? '$statusWarning'
          : '$surface3',
    [riskLevel],
  )

  const hasDetails = Boolean(functionName || contractName || rawData)
  const showDetailsButton = hasDetails

  // Sort sections: Approving first, then Sending, then Receiving
  const sortedSections = useMemo(() => {
    const order = {
      [TransactionSectionType.Approving]: 0,
      [TransactionSectionType.Sending]: 1,
      [TransactionSectionType.Receiving]: 2,
    }
    return [...sections].sort((a, b) => order[a.type] - order[b.type])
  }, [sections])

  return (
    <Flex
      backgroundColor="$surface2"
      borderColor={borderColor}
      borderWidth="$spacing1"
      borderRadius="$rounded16"
      overflow="hidden"
    >
      <Flex gap="$spacing12" pb="$spacing12" pt="$spacing16">
        {errorType && <TransactionErrorSection errorType={errorType} />}

        {sortedSections.map((section, index) => {
          const SectionComponent = getSectionComponent(section.type)

          return (
            <Flex key={`section-${section.type}-${index}`} mt={index > 0 ? '$spacing12' : undefined}>
              <SectionComponent assets={section.assets} riskLevel={riskLevel} />
            </Flex>
          )
        })}

        {children}

        {showDetailsButton && (
          <Flex>
            <Flex height={1} backgroundColor="$surface3" mb="$spacing12" />

            <TouchableArea onPress={toggleDetails}>
              <Flex row alignItems="center" justifyContent="space-between" px="$spacing16">
                <Flex row gap="$spacing8" alignItems="center">
                  <ContractInteraction color="$neutral2" size="$icon.16" />
                  <Text color="$neutral2" variant="buttonLabel3">
                    {isDetailsExpanded ? t('dapp.transaction.details.hide') : t('common.button.viewDetails')}
                  </Text>
                </Flex>
                <RotatableChevron
                  color="$neutral2"
                  direction={isDetailsExpanded ? 'up' : 'down'}
                  height={iconSizes.icon12}
                  width={iconSizes.icon12}
                />
              </Flex>
            </TouchableArea>

            {isDetailsExpanded && (
              <Flex pt="$spacing12">
                <TransactionRequestDetails
                  functionName={functionName}
                  contractName={contractName}
                  contractAddress={contractAddress}
                  rawData={rawData}
                  chainId={chainId}
                  riskLevel={riskLevel}
                />
              </Flex>
            )}
          </Flex>
        )}
      </Flex>
    </Flex>
  )
}

/**
 * Maps section type to the appropriate component
 */
function getSectionComponent(
  type: TransactionSectionType,
): typeof TransactionSendingSection | typeof TransactionReceivingSection | typeof TransactionApprovingSection {
  switch (type) {
    case TransactionSectionType.Sending:
      return TransactionSendingSection
    case TransactionSectionType.Receiving:
      return TransactionReceivingSection
    case TransactionSectionType.Approving:
      return TransactionApprovingSection
    default:
      return TransactionSendingSection
  }
}
