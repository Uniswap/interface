import {
  GATED_FEATURE_OPTIONS,
  RESTRICTION_REASON_OPTIONS,
  setComplianceOverrideEnabled,
  toggleFeatureGated,
  toggleTokenReasonOverride,
  useComplianceOverrideEnabled,
  useGatedFeatureSet,
  useOverriddenTokenReasons,
} from '@universe/compliance'
import { Flex, LabeledCheckbox, Switch, Text } from 'ui/src'

/**
 * Dev-only control to override the compliance read hooks (see `@universe/compliance`).
 * Renders just the rows; the host supplies the section heading.
 */
export function ComplianceOverrides(): JSX.Element {
  const enabled = useComplianceOverrideEnabled()
  const gatedFeatures = useGatedFeatureSet()
  const tokenReasons = useOverriddenTokenReasons()

  return (
    <Flex gap="$spacing12" width="100%">
      <Flex row alignItems="center" gap="$spacing16" width="100%">
        <Flex fill>
          <Text variant="body2">Override compliance</Text>
          <Text variant="body4" color="$neutral2">
            Mocks the read hooks locally; not sent to the server. Off = real server value.
          </Text>
        </Flex>
        <Switch checked={enabled} variant="branded" onCheckedChange={setComplianceOverrideEnabled} />
      </Flex>

      {enabled && (
        <>
          <Flex gap="$spacing8">
            <Text variant="body3" color="$neutral2">
              Enabled features (unchecked = geo-gated)
            </Text>
            {GATED_FEATURE_OPTIONS.map(({ value, label }) => (
              <LabeledCheckbox
                key={label}
                checked={!gatedFeatures.includes(value)}
                text={label}
                onCheckPressed={() => toggleFeatureGated(value)}
              />
            ))}
          </Flex>

          <Flex gap="$spacing8">
            <Text variant="body3" color="$neutral2">
              Token restrictions
            </Text>
            {RESTRICTION_REASON_OPTIONS.map(({ value, label }) => (
              <LabeledCheckbox
                key={label}
                checked={tokenReasons.includes(value)}
                text={label}
                onCheckPressed={() => toggleTokenReasonOverride(value)}
              />
            ))}
          </Flex>
        </>
      )}
    </Flex>
  )
}
