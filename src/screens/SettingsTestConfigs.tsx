import React from 'react'
import { ScrollView } from 'react-native'
import { Switch } from 'src/components/buttons/Switch'
import { Flex } from 'src/components/layout'
import { SheetScreen } from 'src/components/layout/SheetScreen'
import { SettingsBackButtonRow } from 'src/components/Settings/BackButtonRow'
import { Text } from 'src/components/Text'
import { isEnabled, useTestConfigManager } from 'src/features/remoteConfig'
import { flex } from 'src/styles/flex'
import { theme } from 'src/styles/theme'

export function SettingsTestConfigs() {
  const [testConfigs, toggleLocalConfig] = useTestConfigManager()

  return (
    <SheetScreen px="lg">
      <ScrollView contentContainerStyle={{ ...flex.fill, paddingTop: theme.spacing.xxl }}>
        <Flex>
          <SettingsBackButtonRow>
            <Text variant="largeLabel">Test Configs</Text>
          </SettingsBackButtonRow>

          <Text variant="body">List of all test configs available to the app</Text>
          <Text variant="caption">
            Remote-only test configs cannot be toggled locally. Use the Firebase console instead.
          </Text>
          <ScrollView>
            {testConfigs.map(([name, configValue]) => {
              const enabled = isEnabled(name)

              return (
                <Flex key={name} row alignItems="center" justifyContent="space-between">
                  <Text variant="body">{name}</Text>
                  {configValue.getSource() === 'default' ? (
                    <Switch
                      value={enabled}
                      onValueChange={() => toggleLocalConfig({ config: name, enabled: !enabled })}
                    />
                  ) : (
                    <Text variant="caption">Remote only</Text>
                  )}
                </Flex>
              )
            })}
          </ScrollView>
        </Flex>
      </ScrollView>
    </SheetScreen>
  )
}
