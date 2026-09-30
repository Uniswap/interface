import { Flex, Text, TouchableArea } from '@universe/mycelium'
import { TestID, TestIDType } from '@universe/test'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Button, useSporeColors } from 'ui/src'
import type { GeneratedIcon } from 'ui/src/components/factories/createIcon'
import { ChartPie } from 'ui/src/components/icons/ChartPie'
import { Check } from 'ui/src/components/icons/Check'
import { Clock } from 'ui/src/components/icons/Clock'
import { DocumentList } from 'ui/src/components/icons/DocumentList'
import { Dollar } from 'ui/src/components/icons/Dollar'
import { ExternalLink } from 'ui/src/components/icons/ExternalLink'
import { Person } from 'ui/src/components/icons/Person'
import { PoolsLogo } from 'ui/src/components/icons/PoolsLogo'
import { Rocket } from 'ui/src/components/icons/Rocket'
import { Shield } from 'ui/src/components/icons/Shield'
import { X } from 'ui/src/components/icons/X'
import { iconSizes, opacifyRaw, validColor } from 'ui/src/theme'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { openUri } from 'uniswap/src/utils/linking'
import { logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'
import { usePoolsBrandGreen } from '~/hooks/usePoolsBrandGreen'
import { QUICK_LAUNCH_DURATION_HOURS } from '~/pages/Liquidity/CreateAuction/quickLaunch/quickLaunchPreset'

const LAUNCH_AUCTION_HREF = '/liquidity/launch-auction'
const POOLS_URL = 'https://pools.xyz'

type LaunchOption = 'custom' | 'pools'

interface LaunchTokenModalProps {
  isOpen: boolean
  onClose: () => void
}

export function LaunchTokenModal({ isOpen, onClose }: LaunchTokenModalProps): JSX.Element {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const colors = useSporeColors()
  const poolsBrandGreen = usePoolsBrandGreen()
  const [selected, setSelected] = useState<LaunchOption>('custom')

  const openPoolsTrade = useEvent(() => {
    onClose()
    openUri({ uri: POOLS_URL, openExternalBrowser: true }).catch((e) => {
      logger.error(e, { tags: { file: 'LaunchTokenModal', function: 'openPoolsTrade' } })
    })
  })

  const handleContinue = useEvent(() => {
    if (selected === 'pools') {
      openPoolsTrade()
      return
    }
    onClose()
    navigate(LAUNCH_AUCTION_HREF)
  })

  return (
    <Modal
      name={ModalName.LaunchTokenSelection}
      isModalOpen={isOpen}
      onClose={onClose}
      maxWidth={820}
      padding="$spacing20"
    >
      <Flex gap="$spacing20" width="100%">
        <Flex row justifyContent="space-between" alignItems="flex-start" gap="$spacing12">
          <Flex gap="$spacing2" shrink>
            <Text variant="subheading1" color="$neutral1">
              {t('toucan.launchToken.modal.title')}
            </Text>
            <Text variant="body3" color="$neutral2">
              {t('toucan.launchToken.modal.subtitle')}
            </Text>
          </Flex>
          <TouchableArea onPress={onClose}>
            <X size="$icon.20" color="$neutral2" />
          </TouchableArea>
        </Flex>

        <Flex row gap="$spacing12" $md={{ flexDirection: 'column' }}>
          <LaunchOptionCard
            testID={TestID.LaunchTokenModalCustomOption}
            elementName={ElementName.LaunchTokenModalCustomOption}
            icon={Shield}
            iconColor={colors.accent1.val}
            title={t('toucan.launchToken.custom.title')}
            description={t('toucan.launchToken.custom.description')}
            features={[
              { icon: Clock, label: t('toucan.launchToken.custom.feature.durations') },
              { icon: ChartPie, label: t('toucan.launchToken.custom.feature.liquidity') },
              { icon: Person, label: t('toucan.launchToken.custom.feature.kyc') },
            ]}
            selected={selected === 'custom'}
            onSelect={() => setSelected('custom')}
          />
          <LaunchOptionCard
            testID={TestID.LaunchTokenModalPoolsOption}
            elementName={ElementName.LaunchTokenModalPoolsOption}
            icon={PoolsLogo}
            iconColor={poolsBrandGreen}
            title={t('toucan.launchToken.pools.title')}
            titleAdornment={<ExternalLink size="$icon.16" color="$neutral2" />}
            titleTestID={TestID.LaunchTokenModalPoolsLink}
            onTitlePress={openPoolsTrade}
            persistentTopRight={
              <Flex row alignItems="center" gap="$spacing4">
                <Text variant="body4" color="$neutral2">
                  {t('toucan.launchToken.pools.poweredBy')}
                </Text>
                <PoolsLogo size="$icon.16" color="$neutral2" />
                <Text variant="body4" color="$neutral2">
                  {t('toucan.launchToken.pools.title')}
                </Text>
              </Flex>
            }
            description={t('toucan.launchToken.pools.description')}
            features={[
              {
                icon: Rocket,
                label: t('toucan.launchToken.pools.feature.crowdfundHours', { count: QUICK_LAUNCH_DURATION_HOURS }),
              },
              { icon: DocumentList, label: t('toucan.launchToken.pools.feature.presets') },
              { icon: Dollar, label: t('toucan.launchToken.pools.feature.creatorFees') },
            ]}
            selected={selected === 'pools'}
            onSelect={() => setSelected('pools')}
          />
        </Flex>

        <Trace logPress element={ElementName.LaunchTokenModalContinue}>
          <Button
            testID={TestID.LaunchTokenModalContinue}
            emphasis="primary"
            size="medium"
            fill={false}
            width="100%"
            onPress={handleContinue}
          >
            {t('common.button.continue')}
          </Button>
        </Trace>
      </Flex>
    </Modal>
  )
}

interface LaunchOptionFeature {
  icon: GeneratedIcon
  label: string
}

interface LaunchOptionCardProps {
  testID: TestIDType
  elementName: ElementName
  icon: GeneratedIcon
  iconColor: string
  title: string
  titleAdornment?: JSX.Element
  titleTestID?: TestIDType
  /** When set, the title row is a separate link (opens directly, independent of card selection). */
  onTitlePress?: () => void
  /** Top-right slot rendered regardless of selection (e.g. the "Powered by" lockup); replaces the checkmark. */
  persistentTopRight?: JSX.Element
  description: string
  features: LaunchOptionFeature[]
  selected: boolean
  onSelect: () => void
}

function LaunchOptionCard({
  testID,
  elementName,
  icon: Icon,
  iconColor,
  title,
  titleAdornment,
  titleTestID,
  onTitlePress,
  persistentTopRight,
  description,
  features,
  selected,
  onSelect,
}: LaunchOptionCardProps): JSX.Element {
  const titleRow = (
    <Flex row alignItems="center" gap="$spacing6">
      <Text variant="subheading2" color="$neutral1">
        {title}
      </Text>
      {titleAdornment}
    </Flex>
  )

  return (
    <Trace logPress element={elementName}>
      <TouchableArea
        testID={testID}
        flex={1}
        p="$spacing20"
        gap="$spacing24"
        borderRadius="$rounded20"
        borderWidth={1.5}
        borderColor={selected ? '$accent1' : '$surface3'}
        backgroundColor={selected ? '$surface1' : '$surface2'}
        onPress={onSelect}
      >
        <Flex row justifyContent="space-between" alignItems="center" gap="$spacing8">
          <Flex
            width={40}
            height={40}
            borderRadius="$rounded12"
            alignItems="center"
            justifyContent="center"
            backgroundColor={opacifyRaw(12, iconColor)}
          >
            <Icon size="$icon.20" color={validColor(iconColor)} />
          </Flex>
          {persistentTopRight ??
            (selected ? (
              <Flex
                width={iconSizes.icon20}
                height={iconSizes.icon20}
                borderRadius="$roundedFull"
                backgroundColor="$neutral1"
                alignItems="center"
                justifyContent="center"
              >
                <Check size="$icon.12" color="$surface1" />
              </Flex>
            ) : (
              <Flex height={iconSizes.icon20} />
            ))}
        </Flex>

        <Flex gap="$spacing6">
          {onTitlePress ? (
            <TouchableArea testID={titleTestID} alignSelf="flex-start" onPress={onTitlePress}>
              {titleRow}
            </TouchableArea>
          ) : (
            titleRow
          )}
          <Text variant="body3" color="$neutral2">
            {description}
          </Text>
        </Flex>

        <Flex gap="$spacing12">
          {features.map(({ icon: FeatureIcon, label }) => (
            <Flex key={label} row alignItems="center" gap="$spacing12">
              <FeatureIcon size="$icon.16" color="$neutral2" />
              <Text variant="body3" color="$neutral2">
                {label}
              </Text>
            </Flex>
          ))}
        </Flex>
      </TouchableArea>
    </Trace>
  )
}
