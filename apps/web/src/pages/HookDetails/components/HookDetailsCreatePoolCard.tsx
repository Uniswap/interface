import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Button, Flex, Text } from '@universe/mycelium'
import { Pools } from '@universe/mycelium/icons/Pools'
import { TestID } from '@universe/test'
import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { getHookDetailsURL } from 'uniswap/src/utils/linking'
import type { HookDeployment } from '~/features/Hooks/types'
import { getValidHookAddress } from '~/features/Liquidity/utils/getValidHookAddress'
import { getProtocolVersionLabel } from '~/features/Liquidity/utils/protocolVersion'
import { getChainUrlParam } from '~/utils/params/chainParams'
import { buildPoolSearchParams, CREATE_POOL_PATH } from '~/utils/params/poolLinkParams'

function getCreatePoolHref(deployment: Pick<HookDeployment, 'chainId' | 'address'>): string | undefined {
  const hookAddress = getValidHookAddress(deployment.address)
  if (!hookAddress) {
    return undefined
  }
  const params = buildPoolSearchParams({
    chain: getChainUrlParam(deployment.chainId),
    hookAddress,
    entryPoint: getHookDetailsURL({ hookAddress, chainId: deployment.chainId }),
    protocolVersion: getProtocolVersionLabel(ProtocolVersion.V4),
  })
  return `${CREATE_POOL_PATH}?${params}`
}

export function HookDetailsCreatePoolCard({
  deployment,
}: {
  deployment: Pick<HookDeployment, 'chainId' | 'address'>
}): JSX.Element | null {
  const { t } = useTranslation()
  const id = useId()
  const href = getCreatePoolHref(deployment)
  if (!href) {
    return null
  }

  return (
    <Button
      tag="a"
      href={href}
      testID={TestID.HookDetailsCreatePool}
      aria-label={t('hooks.details.createPool')}
      aria-describedby={`${id}-description`}
      emphasis="text-only"
      size="small"
      fill={false}
      width="100%"
      height="auto"
      minHeight={0}
      minWidth={0}
      p="$spacing16"
      gap="$spacing12"
      alignItems="flex-start"
      justifyContent="flex-start"
      borderRadius="$rounded20"
      borderColor="$surface3"
      backgroundColor="$surface1"
      className="hover:bg-surface1-hovered hover:border-surface3-hovered shadow-short"
    >
      <Flex centered width={24} height={24} flexShrink={0} borderRadius="$roundedFull" backgroundColor="$accent2">
        <Pools size="$icon.16" color="$accent1" />
      </Flex>
      <Flex flex={1} minWidth={0} gap="$spacing4" alignItems="flex-start">
        <Text variant="buttonLabel2" lineHeight={24} color="$neutral1" textAlign="left">
          {t('hooks.details.createPool')}
        </Text>
        <Text id={`${id}-description`} variant="body3" lineHeight={20} color="$neutral2" textAlign="left">
          {t('hooks.details.createPool.description')}
        </Text>
      </Flex>
    </Button>
  )
}
