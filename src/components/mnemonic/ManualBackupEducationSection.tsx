import React, { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from 'src/app/hooks'
import BriefcaseIcon from 'src/assets/icons/briefcase.svg'
import EyeIcon from 'src/assets/icons/eye-off.svg'
import LockIcon from 'src/assets/icons/lock.svg'
import { Box, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'

export function ManualBackupEducationSection() {
  const { t } = useTranslation()
  const spacer = <Box borderTopColor="backgroundOutline" borderTopWidth={1} />
  const theme = useAppTheme()
  return (
    <Flex gap="md" py="xl">
      <EducationRow
        icon={<EyeIcon color={theme.colors.textPrimary} height={16} width={16} />}
        label={t('Write it down in private')}
        sublabel={t(
          "Ensure that you're in a private location and write down your recovery phrase's words in order."
        )}
      />
      {spacer}
      <EducationRow
        icon={<BriefcaseIcon color={theme.colors.textPrimary} height={16} width={16} />}
        label={t('Keep it somewhere safe')}
        sublabel={t('Remember that anyone who has your recovery phrase can access your wallet.')}
      />
      {spacer}
      <EducationRow
        icon={<LockIcon color={theme.colors.textPrimary} height={16} width={16} />}
        label={t("Don't lose it")}
        sublabel={t(
          'If you lose your recovery phrase, you’ll lose access to your wallet and its contents.'
        )}
      />
    </Flex>
  )
}

interface EducationRowProps {
  icon: ReactNode
  label: string
  sublabel: string
}

function EducationRow({ icon, label, sublabel }: EducationRowProps) {
  return (
    <Flex row alignItems="flex-start" gap="sm">
      <Flex
        centered
        borderColor="accentBranded"
        borderRadius="md"
        borderWidth={1}
        height={32}
        padding="md"
        width={32}>
        {icon}
      </Flex>
      <Flex flex={1} gap="none">
        <Text color="textPrimary" variant="subhead">
          {label}
        </Text>
        <Flex pr="xl">
          <Text color="textSecondary" variant="caption">
            {sublabel}
          </Text>
        </Flex>
      </Flex>
    </Flex>
  )
}
