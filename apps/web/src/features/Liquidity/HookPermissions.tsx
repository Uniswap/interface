import { Hook } from '@uniswap/v4-sdk'
import { Flex, Text, TouchableArea } from '@universe/mycelium'
import { InfoCircleFilled } from '@universe/mycelium/icons/InfoCircleFilled'
import { Key } from '@universe/mycelium/icons/Key'
import { Fragment, useId } from 'react'
import { useTranslation } from 'react-i18next'
import { InfoTooltip } from 'uniswap/src/components/tooltip/InfoTooltip'
import { isEVMAddressWithChecksum } from 'utilities/src/addresses/evm/evm'
import { getHookPermissionPresentation } from '~/features/Liquidity/utils/getHookPermissionPresentation'

export function HookPermissions({ hookAddress }: { hookAddress: string }): JSX.Element | null {
  const { t } = useTranslation()
  const descriptionId = useId()

  if (!isEVMAddressWithChecksum(hookAddress)) {
    return null
  }

  const flags = Hook.permissions(hookAddress)

  return (
    <Flex role="group" aria-label={t('hooks.details.permissions')} gap="$gap12" minWidth={0}>
      <Flex row alignItems="center" gap="$gap4">
        <Key size="$icon.16" color="$neutral2" />
        <Text tag="h3" m={0} variant="body3" color="$neutral2">
          {t('hooks.details.permissions')}
        </Text>
        <Text id={descriptionId} className="sr-only">
          {t('hooks.permissions.description')}
        </Text>
        <InfoTooltip
          placement="top"
          text={t('hooks.permissions.description')}
          trigger={
            <TouchableArea
              tag="button"
              aria-label={t('hooks.permissions.about')}
              aria-describedby={descriptionId}
              minHeight={24}
              minWidth={24}
              centered
              borderRadius="$rounded8"
            >
              <InfoCircleFilled size="$icon.16" color="$neutral2" />
            </TouchableArea>
          }
        />
      </Flex>
      <Flex row flexWrap="wrap" columnGap="$gap8" rowGap="$gap4">
        {getHookPermissionPresentation(t).map(({ key, label, description }) => {
          const active = flags[key]
          const status = active ? t('common.active') : t('common.inactive')

          return (
            <Fragment key={key}>
              <Text id={`${descriptionId}-${key}`} className="sr-only">
                {description}
              </Text>
              <InfoTooltip
                placement="top"
                text={description}
                trigger={
                  <TouchableArea
                    tag="button"
                    aria-label={t('hooks.permissions.status', { permission: label, status })}
                    aria-describedby={`${descriptionId}-${key}`}
                    minHeight={24}
                    minWidth={24}
                    centered
                    borderRadius="$rounded8"
                  >
                    <Flex
                      backgroundColor={active ? '$statusSuccess2' : '$surface5'}
                      borderRadius="$rounded8"
                      px="$spacing8"
                      py="$spacing2"
                    >
                      <Text variant="monospace" fontWeight="$medium" color={active ? '$statusSuccess' : '$neutral3'}>
                        {label}
                      </Text>
                    </Flex>
                  </TouchableArea>
                }
              />
            </Fragment>
          )
        })}
      </Flex>
    </Flex>
  )
}
