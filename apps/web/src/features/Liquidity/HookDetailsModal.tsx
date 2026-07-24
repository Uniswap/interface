import type { HookEntry } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/types_pb'
import type { ReactNode } from 'react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, ModalCloseIcon, Text } from 'ui/src'
import { BookOpen } from 'ui/src/components/icons/BookOpen'
import { Code } from 'ui/src/components/icons/Code'
import { Globe } from 'ui/src/components/icons/Globe'
import { LayerGroup } from 'ui/src/components/icons/LayerGroup'
import { CopyHelper } from 'uniswap/src/components/CopyHelper/CopyHelper'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { Modal } from 'uniswap/src/components/modals/Modal'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getChainLabel } from 'uniswap/src/features/chains/utils'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { shortenAddress } from 'utilities/src/addresses'
import { getActiveHookFlags } from '~/features/Liquidity/utils/getActiveHookFlags'

interface HookDetailsModalProps {
  hookEntry: HookEntry
  chainId: UniverseChainId
  isOpen: boolean
  onClose: () => void
}

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
export function HookDetailsModal({ hookEntry, chainId, isOpen, onClose }: HookDetailsModalProps) {
  const { t } = useTranslation()
  const activeFlags = useMemo(() => getActiveHookFlags(hookEntry.flags), [hookEntry.flags])

  return (
    <Modal
      name={ModalName.HookDetails}
      isModalOpen={isOpen}
      onClose={onClose}
      analyticsProperties={{ hook_address: hookEntry.address, chain_id: chainId }}
    >
      <Flex gap="$gap16">
        <Flex row alignItems="center" gap="$gap8">
          <Text variant="subheading1" color="$neutral1" flex={1} numberOfLines={1}>
            {hookEntry.name || shortenAddress({ address: hookEntry.address })}
          </Text>
          <ModalCloseIcon onClose={onClose} />
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
        </Flex>
      </Flex>
    </Modal>
  )
}
