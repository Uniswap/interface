import { type PlainMessage } from '@bufbuild/protobuf'
import { BottomSheetScrollView } from '@gorhom/bottom-sheet'
import { useQuery } from '@tanstack/react-query'
import { SharedEventName } from '@uniswap/analytics-events'
import type { GetTokensMultiChainResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { GraphQLApi } from '@universe/api'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useWindowDimensions } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
import { LinkButton, type LinkButtonProps, LinkButtonType } from 'src/components/TokenDetails/LinkButton'
import { useTokenDetailsContext } from 'src/components/TokenDetails/TokenDetailsContext'
import { Flex, Text } from 'ui/src'
import { BlockExplorer, GlobeFilled, Page, XTwitter } from 'ui/src/components/icons'
import { spacing } from 'ui/src/theme'
import { getBlockExplorerIcon } from 'uniswap/src/components/chains/BlockExplorerIcon'
import { Modal } from 'uniswap/src/components/modals/Modal'
import {
  getMultichainTokenEntry,
  getRestMultichainTokenEntry,
} from 'uniswap/src/components/MultichainTokenDetails/getMultichainTokenEntry'
import { MultichainAddressSheet } from 'uniswap/src/components/MultichainTokenDetails/MultichainAddressSheet'
import { MultichainExplorerList } from 'uniswap/src/components/MultichainTokenDetails/MultichainExplorerList'
import {
  type MultichainTokenEntry,
  useOrderedMultichainEntries,
} from 'uniswap/src/components/MultichainTokenDetails/useOrderedMultichainEntries'
import { getGetTokensMultiChainQueryOptions } from 'uniswap/src/data/apiClients/dataApiService/tokens/queries'
import { useTokenProjectUrlsPartsFragment } from 'uniswap/src/data/graphql/fragments'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { useFeatureFlaggedChainIds } from 'uniswap/src/features/chains/hooks/useFeatureFlaggedChainIds'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useTokenMetadata } from 'uniswap/src/features/dataApi/tokenDetails/useTokenDetailsData'
import {
  currencyIdToContractInput,
  currencyIdToRestContractInput,
} from 'uniswap/src/features/dataApi/utils/currencyIdToContractInput'
import { chainIdToPlatform } from 'uniswap/src/features/platforms/utils/chains'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { isDefaultNativeAddress, isNativeCurrencyAddress } from 'uniswap/src/utils/currencyId'
import { ExplorerDataType, getExplorerLink, getTwitterLink, openUri } from 'uniswap/src/utils/linking'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'

const MIN_SHEET_HEIGHT = 520
const INITIAL_SNAP_PERCENT = 0.65

const SCROLL_CONTENT_STYLE = { paddingHorizontal: spacing.spacing24 }

const ListHeaderSpacer = (): JSX.Element => <Flex width="$spacing16" />
const ItemSeparatorComponent = (): JSX.Element => <Flex width="$spacing8" />

const renderItem = ({ item }: { item: LinkButtonProps }): JSX.Element => <LinkButton {...item} />

const keyExtractor = (item: LinkButtonProps): string => item.testID ?? item.label

function selectMultichainAddresses(
  data: PlainMessage<GetTokensMultiChainResponse> | undefined,
): Record<string, string> | undefined {
  return data?.tokens[0]?.addresses
}

/** Fetches cross-chain token data and returns entries ordered by network selector order. */
function useMultichainTokenEntries(currencyId: string): MultichainTokenEntry[] {
  const isV2TokensEnabled = useFeatureFlag(FeatureFlags.V2EndpointsTokens)
  const featureFlaggedChainIds = useFeatureFlaggedChainIds()

  const contractInput = useMemo(() => currencyIdToContractInput(currencyId), [currencyId])
  const { data: legacyData } = GraphQLApi.useTokenProjectsQuery({
    variables: { contracts: [contractInput] },
    skip: isV2TokensEnabled,
  })

  // Batch (GetTokensMultiChain) rather than singular GetTokenMultiChain, for future multi-token use.
  const restTokenIdentifier = useMemo(() => currencyIdToRestContractInput(currencyId), [currencyId])
  const { data: restAddresses } = useQuery(
    getGetTokensMultiChainQueryOptions({
      params: { identifier: { case: 'tokens', value: { tokens: [restTokenIdentifier] } } },
      enabled: isV2TokensEnabled,
      select: selectMultichainAddresses,
    }),
  )

  const entries = useMemo(() => {
    if (isV2TokensEnabled) {
      const result: MultichainTokenEntry[] = []
      for (const [chainIdKey, address] of Object.entries(restAddresses ?? {})) {
        const entry = getRestMultichainTokenEntry({ chainIdKey, address }, featureFlaggedChainIds)
        if (entry) {
          result.push(entry)
        }
      }
      return result
    }

    const tokens = legacyData?.tokenProjects?.[0]?.tokens
    if (!tokens) {
      return []
    }

    const result: MultichainTokenEntry[] = []
    for (const token of tokens) {
      const entry = getMultichainTokenEntry(token, featureFlaggedChainIds)
      if (entry) {
        result.push(entry)
      }
    }
    return result
  }, [isV2TokensEnabled, restAddresses, legacyData, featureFlaggedChainIds])

  return useOrderedMultichainEntries(entries)
}

export function TokenDetailsLinks(): JSX.Element {
  const { t } = useTranslation()
  const trace = useTrace()

  const {
    address,
    chainId,
    currencyId,
    isMultichainAddressSheetOpen,
    openMultichainAddressSheet,
    closeMultichainAddressSheet,
  } = useTokenDetailsContext()

  const multichainEntries = useMultichainTokenEntries(currencyId)
  const hasMultipleChains = multichainEntries.length > 1

  const { height: screenHeight } = useWindowDimensions()
  const multichainSnapPoints = useMemo(() => {
    const percentHeight = INITIAL_SNAP_PERCENT * screenHeight
    const initialSnap = Math.min(Math.max(percentHeight, MIN_SHEET_HEIGHT), screenHeight)
    return [initialSnap, '100%']
  }, [screenHeight])

  const projectUrls = useTokenProjectUrlsPartsFragment({ currencyId }).data.project
  const { homepageUrl, twitterName } = useTokenMetadata(currencyId, {
    legacyToken: { project: { homepageUrl: projectUrls?.homepageUrl, twitterName: projectUrls?.twitterName } },
  })

  const explorerLink = getExplorerLink({ chainId, data: address, type: ExplorerDataType.TOKEN })
  const explorerName = getChainInfo(chainId).explorer.name

  const isNativeCurrency = isNativeCurrencyAddress(chainId, address)

  const [isExplorerSheetOpen, setIsExplorerSheetOpen] = useState(false)

  const handleExplorerPress = useCallback(
    async (url: string, explorerChainId: UniverseChainId) => {
      sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
        ...trace,
        element: ElementName.TokenExplorerLink,
        chain_name: getChainInfo(explorerChainId).urlParam,
      })
      await openUri({ uri: url })
      setIsExplorerSheetOpen(false)
    },
    [trace],
  )

  const links = useMemo((): LinkButtonProps[] => {
    const showMultichainDropdowns = hasMultipleChains
    const isNativeAddress = isDefaultNativeAddress({ address, platform: chainIdToPlatform(chainId) })
    const items: LinkButtonProps[] = []

    if (!isNativeAddress) {
      if (showMultichainDropdowns) {
        items.push({
          Icon: Page,
          element: ElementName.MultichainAddress,
          label: t('common.address'),
          testID: TestID.MultichainAddressDropdown,
          onPress: openMultichainAddressSheet,
        })
      } else {
        items.push({
          buttonType: LinkButtonType.Copy,
          element: ElementName.Copy,
          label: t('common.text.contract'),
          testID: TestID.TokenLinkCopy,
          value: address,
        })
      }
    }

    if (!isNativeCurrency) {
      if (showMultichainDropdowns) {
        items.push({
          Icon: BlockExplorer,
          element: ElementName.MultichainExplorer,
          label: t('common.explorer'),
          testID: TestID.MultichainExplorerDropdown,
          onPress: () => setIsExplorerSheetOpen(true),
        })
      } else {
        items.push({
          Icon: getBlockExplorerIcon(chainId),
          buttonType: LinkButtonType.Link,
          element: ElementName.TokenLinkEtherscan,
          label: explorerName,
          testID: TestID.TokenLinkEtherscan,
          value: explorerLink,
        })
      }
    }

    if (homepageUrl) {
      items.push({
        Icon: GlobeFilled,
        buttonType: LinkButtonType.Link,
        element: ElementName.TokenLinkWebsite,
        label: t('token.links.website'),
        testID: TestID.TokenLinkWebsite,
        value: homepageUrl,
      })
    }

    if (twitterName) {
      items.push({
        Icon: XTwitter,
        buttonType: LinkButtonType.Link,
        element: ElementName.TokenLinkTwitter,
        label: t('token.links.twitter'),
        testID: TestID.TokenLinkTwitter,
        value: getTwitterLink(twitterName),
      })
    }

    return items
  }, [
    chainId,
    address,
    isNativeCurrency,
    hasMultipleChains,
    openMultichainAddressSheet,
    homepageUrl,
    twitterName,
    explorerName,
    explorerLink,
    t,
  ])

  return (
    <Flex gap="$spacing8">
      <Text color="$neutral2" mx="$spacing16" variant="subheading2">
        {t('token.links.title')}
      </Text>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={links}
        ListHeaderComponent={ListHeaderSpacer}
        ListFooterComponent={ItemSeparatorComponent}
        ItemSeparatorComponent={ItemSeparatorComponent}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
      />

      {isExplorerSheetOpen && (
        <Modal
          fullScreen
          overrideInnerContainer
          name={ModalName.MultichainExplorerModal}
          snapPoints={multichainSnapPoints}
          onClose={() => setIsExplorerSheetOpen(false)}
        >
          <BottomSheetScrollView contentContainerStyle={SCROLL_CONTENT_STYLE} showsVerticalScrollIndicator={false}>
            <MultichainExplorerList renderedInModal chains={multichainEntries} onExplorerPress={handleExplorerPress} />
          </BottomSheetScrollView>
        </Modal>
      )}

      <MultichainAddressSheet
        isOpen={isMultichainAddressSheetOpen}
        chains={multichainEntries}
        onClose={closeMultichainAddressSheet}
      />
    </Flex>
  )
}
