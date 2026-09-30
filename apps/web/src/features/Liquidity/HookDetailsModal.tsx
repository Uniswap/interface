import type { HookEntry } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/types_pb'
import type { UniverseChainId } from '@universe/chains'
import { Flex, ModalCloseIcon, Text, TouchableArea } from '@universe/mycelium'
import { BookOpen } from '@universe/mycelium/icons/BookOpen'
import { Code } from '@universe/mycelium/icons/Code'
import { ExternalLink } from '@universe/mycelium/icons/ExternalLink'
import { Globe } from '@universe/mycelium/icons/Globe'
import { LayerGroup } from '@universe/mycelium/icons/LayerGroup'
import { Person } from '@universe/mycelium/icons/Person'
import { TestID } from '@universe/test'
import type { ReactNode } from 'react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { CopyHelper } from 'uniswap/src/components/CopyHelper/CopyHelper'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { UniswapBuiltHookMark } from 'uniswap/src/components/logos/UniswapBuiltHookMark'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { LearnMoreLink } from 'uniswap/src/components/text/LearnMoreLink'
import { InfoTooltip } from 'uniswap/src/components/tooltip/InfoTooltip'
import { UniswapHelpUrls } from 'uniswap/src/constants/urls'
import { getChainLabel } from 'uniswap/src/features/chains/utils'
import {
  getUniswapHookProvenanceDescription,
  getUniswapHookProvenanceLabel,
  useUniswapHookProvenance,
} from 'uniswap/src/features/poolHooks/hooks/useUniswapHookProvenance'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { openUri } from 'uniswap/src/utils/linking'
import { shortenAddress } from 'utilities/src/addresses'
import { isEVMAddress } from 'utilities/src/addresses/evm/evm'
import { logger } from 'utilities/src/logger/logger'
import { getActiveHookFlags } from '~/features/Liquidity/utils/getActiveHookFlags'

interface HookDetailsModalProps {
  hookEntry: HookEntry
  chainId: UniverseChainId
  isOpen: boolean
  onClose: () => void
}

// PoolTable and the position rows open this modal from a cell inside a react-router <Link>. Portaling
// the dialog moves it out of that anchor in the DOM, but React synthetic clicks still bubble through the
// portal to the Link, which preventDefaults and navigates on any click nothing stopped — plain text, or
// the badge tooltip's "Learn more" anchor (whose own navigation that preventDefault also cancels).
// TouchableAreas stop propagation themselves; this catches everything else at the content root.
const stopPropagation = (event: { stopPropagation: () => void }): void => event.stopPropagation()

// Labeled row inside the details card: small muted leading icon + label on the left, value beside it.
function DetailRow({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <Flex row alignItems="flex-start" gap="$gap12">
      <Flex row alignItems="center" gap="$gap8" width={100} flexShrink={0}>
        {icon}
        <Text variant="body3" color="$neutral2">
          {label}
        </Text>
      </Flex>
      <Flex flex={1} minWidth={0}>
        {children}
      </Flex>
    </Flex>
  )
}

// Details dialog opened by clicking a hook name in the pools table: the hook name as the title,
// then a card with labeled rows for chain, address (copyable), description, and active flags.
// Hooks Uniswap built or configured additionally surface that provenance (a "Built by Uniswap" /
// "Configured by Uniswap" / "Built and configured by Uniswap" badge whose hover tooltip links to the help
// center, the configuring deployer, and a documentation link).
export function HookDetailsModal({ hookEntry, chainId, isOpen, onClose }: HookDetailsModalProps) {
  const { t } = useTranslation()
  const activeFlags = useMemo(() => getActiveHookFlags(hookEntry.flags), [hookEntry.flags])
  const getUniswapHookProvenance = useUniswapHookProvenance()
  // Gate on the trusted `chainId` prop — the chain the UI displays and looked the hook up by — not the
  // registry entry's self-reported `hookEntry.chainId`. Keying on the vouched-for entry's own field would
  // let a response reporting a different chain earn a Uniswap badge for a chain the address isn't
  // allowlisted on.
  const provenance = getUniswapHookProvenance({ chainId, address: hookEntry.address })
  const isUniswapHook = provenance !== undefined

  return (
    <Modal
      name={ModalName.HookDetails}
      isModalOpen={isOpen}
      onClose={onClose}
      analyticsProperties={{ hook_address: hookEntry.address, chain_id: chainId }}
    >
      <Flex gap="$gap16" onPress={stopPropagation}>
        <Flex gap="$gap4">
          <Flex row alignItems="center" gap="$gap8">
            <Text variant="subheading1" color="$neutral1" flex={1} numberOfLines={1}>
              {hookEntry.name || shortenAddress({ address: hookEntry.address })}
            </Text>
            <ModalCloseIcon onClose={onClose} />
          </Flex>
          {provenance !== undefined ? (
            // The whole badge is the hover target — no separate info icon — so the tooltip reads as an
            // explanation of the line itself.
            <InfoTooltip
              placement="top"
              trigger={
                <Flex row alignItems="center" gap="$gap4" testID={TestID.HookProvenanceInfo}>
                  <UniswapBuiltHookMark />
                  <Text variant="body3" color="$accent1">
                    {getUniswapHookProvenanceLabel({ provenance, t })}
                  </Text>
                </Flex>
              }
              text={
                <Text variant="body4" color="$neutral1">
                  {getUniswapHookProvenanceDescription({ provenance, t })}
                </Text>
              }
              button={
                <LearnMoreLink
                  textVariant="body4"
                  textColor="$neutral2"
                  url={UniswapHelpUrls.articles.uniswapBuiltHooks}
                />
              }
            />
          ) : null}
        </Flex>

        <Flex backgroundColor="$surface2" borderRadius="$rounded16" p="$padding16" gap="$gap12">
          <DetailRow icon={<Globe size="$icon.16" color="$neutral2" />} label={t('common.chain')}>
            <Flex row alignItems="center" gap="$gap4">
              <NetworkLogo chainId={chainId} size={16} />
              <Text variant="body3" color="$neutral1">
                {getChainLabel(chainId)}
              </Text>
            </Flex>
          </DetailRow>

          {isUniswapHook && hookEntry.deployer ? (
            <DetailRow icon={<Person size="$icon.16" color="$neutral2" />} label={t('hook.details.configuredBy')}>
              <Text variant="body3" color="$neutral1">
                {isEVMAddress(hookEntry.deployer)
                  ? shortenAddress({ address: hookEntry.deployer })
                  : hookEntry.deployer}
              </Text>
            </DetailRow>
          ) : null}

          <DetailRow icon={<LayerGroup size="$icon.16" color="$neutral2" />} label={t('common.address')}>
            <CopyHelper toCopy={hookEntry.address} iconSize={14} iconPosition="right" alwaysShowIcon>
              <Text variant="body3" color="$neutral1" numberOfLines={1}>
                {shortenAddress({ address: hookEntry.address, chars: 14, charsEnd: 8 })}
              </Text>
            </CopyHelper>
          </DetailRow>

          {hookEntry.description ? (
            <DetailRow icon={<BookOpen size="$icon.16" color="$neutral2" />} label={t('common.description')}>
              <Flex gap="$gap4">
                <Text variant="body3" color="$neutral1">
                  {hookEntry.description}
                </Text>
                <Text variant="body4" color="$neutral3">
                  {t('hook.description.generatedByAi')}
                </Text>
              </Flex>
            </DetailRow>
          ) : null}

          {activeFlags.length > 0 ? (
            <DetailRow icon={<Code size="$icon.16" color="$neutral2" />} label={t('common.flags')}>
              <Flex row flexWrap="wrap" gap="$gap4">
                {activeFlags.map((flag) => (
                  <Flex key={flag} backgroundColor="$surface3" borderRadius="$rounded8" px="$spacing8" py="$spacing2">
                    <Text variant="monospace" color="$neutral2">
                      {flag}
                    </Text>
                  </Flex>
                ))}
              </Flex>
            </DetailRow>
          ) : null}

          {isUniswapHook && hookEntry.auditUrl ? (
            <>
              <Flex height={1} backgroundColor="$surface3" />
              <TouchableArea
                onPress={() => {
                  openUri({ uri: hookEntry.auditUrl, openExternalBrowser: true }).catch((e) => {
                    logger.error(e, { tags: { file: 'HookDetailsModal', function: 'openDocumentation' } })
                  })
                }}
              >
                <Flex row alignItems="center" gap="$gap4">
                  <Text variant="body3" color="$neutral1">
                    {t('hook.details.viewDocumentation')}
                  </Text>
                  <ExternalLink size="$icon.16" color="$neutral2" />
                </Flex>
              </TouchableArea>
            </>
          ) : null}
        </Flex>
      </Flex>
    </Modal>
  )
}
