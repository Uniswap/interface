import { useModalState } from 'hooks/useModalState'
import styledDep from 'lib/styled-components'
import { useExternallyConnectableExtensionId } from 'pages/ExtensionPasskeyAuthPopUp/useExternallyConnectableExtensionId'
import { ChangeEvent, PropsWithChildren, useCallback } from 'react'
import { Button, Flex, ModalCloseIcon, Text, styled } from 'ui/src'
import { LayerRow } from 'uniswap/src/components/gating/Rows'
import { Modal } from 'uniswap/src/components/modals/Modal'
import {
  DynamicConfigKeys,
  DynamicConfigs,
  ExternallyConnectableExtensionConfigKey,
  NetworkRequestsConfigKey,
} from 'uniswap/src/features/gating/configs'
import { Layers } from 'uniswap/src/features/gating/experiments'
import { FeatureFlags, getFeatureFlagName } from 'uniswap/src/features/gating/flags'
import { useFeatureFlagWithExposureLoggingDisabled } from 'uniswap/src/features/gating/hooks'
import { getOverrideAdapter } from 'uniswap/src/features/gating/sdk/statsig'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { isPlaywrightEnv } from 'utilities/src/environment/env'
import { TRUSTED_CHROME_EXTENSION_IDS } from 'utilities/src/environment/extensionId'

const CenteredRow = styled(Flex, {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  py: '$gap8',
  maxWidth: '100%',
  gap: '$gap4',
})

const FlagInfo = styled(Flex, {
  pl: '$padding8',
  flexShrink: 1,
})

interface FeatureFlagProps {
  label: string
  flag: FeatureFlags
}

function FeatureFlagGroup({ name, children }: PropsWithChildren<{ name: string }>) {
  return (
    <>
      <CenteredRow key={name}>
        <Text variant="body1">{name}</Text>
      </CenteredRow>
      {children}
    </>
  )
}

const FlagVariantSelection = styledDep.select`
  border-radius: 12px;
  padding: 8px;
  background: ${({ theme }) => theme.surface3};
  font-weight: 535;
  font-size: 16px;
  border: none;
  color: ${({ theme }) => theme.neutral1};
  cursor: pointer;
  :hover {
    background: ${({ theme }) => theme.surface3};
  }
`

function Variant({ option }: { option: string }) {
  return <option value={option}>{option}</option>
}

function FeatureFlagOption({ flag, label }: FeatureFlagProps) {
  const enabled = useFeatureFlagWithExposureLoggingDisabled(flag)
  const name = getFeatureFlagName(flag)

  const onFlagVariantChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      getOverrideAdapter().overrideGate(name, e.target.value === 'Enabled' ? true : false)
    },
    [name],
  )

  return (
    <CenteredRow key={flag}>
      <FlagInfo>
        <Text variant="body2">{name}</Text>
        <Text variant="body4" color="$neutral2">
          {label}
        </Text>
      </FlagInfo>
      <FlagVariantSelection id={name} onChange={onFlagVariantChange} value={enabled ? 'Enabled' : 'Disabled'}>
        {['Enabled', 'Disabled'].map((variant) => (
          <Variant key={variant} option={variant} />
        ))}
      </FlagVariantSelection>
    </CenteredRow>
  )
}

function DynamicConfigDropdown<
  Conf extends Exclude<DynamicConfigs, DynamicConfigs.GasStrategies>,
  Key extends DynamicConfigKeys[Conf],
>({
  config,
  configKey,
  label,
  options,
  selected,
  parser,
  allowMultiple = true,
}: {
  config: Conf
  configKey: Key
  label: string
  options: Array<string | number> | Record<string, string | number>
  selected: unknown[]
  parser: (opt: string) => any
  allowMultiple?: boolean
}) {
  const handleSelectChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedValues = Array.from(e.target.selectedOptions, (opt) => parser(opt.value))
      getOverrideAdapter().overrideDynamicConfig(config, {
        [configKey]: allowMultiple ? selectedValues : selectedValues[0],
      })
    },
    [allowMultiple, config, configKey, parser],
  )
  return (
    <CenteredRow key={config}>
      <FlagInfo>
        <Text variant="body2">{config}</Text>
        <Text variant="body4" color="$neutral2">
          {label}
        </Text>
      </FlagInfo>
      <select multiple={allowMultiple} onChange={handleSelectChange}>
        {Array.isArray(options)
          ? options.map((opt) => (
              <option key={opt} value={opt} selected={selected.includes(opt)}>
                {opt}
              </option>
            ))
          : Object.entries(options).map(([key, value]) => (
              <option key={key} value={value} selected={selected.includes(value)}>
                {key}
              </option>
            ))}
      </select>
    </CenteredRow>
  )
}

export default function FeatureFlagModal() {
  const { isOpen, closeModal } = useModalState(ModalName.FeatureFlags)
  const removeAllOverrides = () => {
    getOverrideAdapter().removeAllOverrides()
  }
  return (
    <Modal name={ModalName.FeatureFlags} isModalOpen={isOpen} onClose={closeModal} padding={0}>
      <Flex py="$gap20" px="$gap16" gap="$gap8">
        <CenteredRow borderBottomColor="$surface3" borderBottomWidth={1}>
          <Flex row grow alignItems="center" justifyContent="space-between">
            <Text variant="subheading2">Feature Flag Settings</Text>
            <Button onPress={removeAllOverrides} variant="branded" size="small" fill={false}>
              Clear Overrides
            </Button>
          </Flex>
          <ModalCloseIcon onClose={closeModal} />
        </CenteredRow>
        <Flex maxHeight="600px" pb="$gap8" overflow="scroll" $md={{ maxHeight: 'unset' }}>
          <FeatureFlagGroup name="Swap Refactor">
            <FeatureFlagOption
              flag={FeatureFlags.ServiceBasedSwapTransactionInfo}
              label="Enable service-based swap transaction info"
            />
          </FeatureFlagGroup>
          <FeatureFlagGroup name="Swap Features">
            <FeatureFlagOption flag={FeatureFlags.BatchedSwaps} label="Enable Batched Swaps" />
            <FeatureFlagOption flag={FeatureFlags.IndicativeSwapQuotes} label="Enable Quick Routes" />
            <FeatureFlagOption flag={FeatureFlags.UniquoteEnabled} label="Enable Uniquote" />
            <FeatureFlagOption flag={FeatureFlags.ViemProviderEnabled} label="Enable Viem Provider" />
            <FeatureFlagOption flag={FeatureFlags.InstantTokenBalanceUpdate} label="Instant token balance update" />
            <FeatureFlagOption flag={FeatureFlags.LimitsFees} label="Enable Limits fees" />
            <FeatureFlagOption flag={FeatureFlags.EnablePermitMismatchUX} label="Enable Permit2 mismatch detection" />
            <FeatureFlagOption
              flag={FeatureFlags.ForcePermitTransactions}
              label="Force Permit2 transaction instead of signatures, always"
            />
            <FeatureFlagOption flag={FeatureFlags.SwapSettingsV4HooksToggle} label="Swap Settings V4 Hooks Toggle" />
            <FeatureFlagOption
              flag={FeatureFlags.ForceDisableWalletGetCapabilities}
              label="Force disable wallet get capabilities result"
            />
          </FeatureFlagGroup>
          <FeatureFlagGroup name="UniswapX">
            <FeatureFlagOption flag={FeatureFlags.UniswapX} label="Enable UniswapX" />
            <FeatureFlagOption
              flag={FeatureFlags.UniswapXPriorityOrdersBase}
              label="UniswapX Priority Orders (on Base)"
            />
            <FeatureFlagOption
              flag={FeatureFlags.UniswapXPriorityOrdersUnichain}
              label="UniswapX Priority Orders (on Unichain)"
            />
            <FeatureFlagOption flag={FeatureFlags.ArbitrumDutchV3} label="Enable Dutch V3 on Arbitrum" />
          </FeatureFlagGroup>
          <FeatureFlagGroup name="LP">
            <FeatureFlagOption flag={FeatureFlags.LpIncentives} label="Enable LP Incentives" />
            <FeatureFlagOption flag={FeatureFlags.PositionPageV2} label="Enable Position Page V2" />
          </FeatureFlagGroup>
          <FeatureFlagGroup name="Embedded Wallet">
            <FeatureFlagOption flag={FeatureFlags.EmbeddedWallet} label="Add internal embedded wallet functionality" />
            <DynamicConfigDropdown
              selected={[useExternallyConnectableExtensionId()]}
              options={TRUSTED_CHROME_EXTENSION_IDS}
              parser={(id) => id}
              config={DynamicConfigs.ExternallyConnectableExtension}
              configKey={ExternallyConnectableExtensionConfigKey.ExtensionId}
              label="Which Extension the web app will communicate with"
              allowMultiple={false}
            />
          </FeatureFlagGroup>
          <FeatureFlagGroup name="Search">
            <FeatureFlagOption flag={FeatureFlags.SearchRevamp} label="Enable search revamp" />
            <FeatureFlagOption
              flag={FeatureFlags.PoolSearch}
              label="Enable pool search (turn on search_revamp as well to see)"
            />
          </FeatureFlagGroup>
          <FeatureFlagGroup name="New Chains">
            <FeatureFlagOption flag={FeatureFlags.MonadTestnet} label="Enable Monad Testnet" />
            <FeatureFlagOption flag={FeatureFlags.Soneium} label="Enable Soneium" />
            <FeatureFlagOption flag={FeatureFlags.MonadTestnetDown} label="Enable Monad Testnet Down Banner" />
          </FeatureFlagGroup>
          <FeatureFlagGroup name="Network Requests">
            <DynamicConfigDropdown
              selected={[30]}
              options={[1, 10, 20, 30]}
              parser={Number.parseInt}
              config={DynamicConfigs.NetworkRequests}
              configKey={NetworkRequestsConfigKey.BalanceMaxRefetchAttempts}
              label="Max refetch attempts"
            />
          </FeatureFlagGroup>
          <FeatureFlagGroup name="Debug">
            <FeatureFlagOption flag={FeatureFlags.TraceJsonRpc} label="Enables JSON-RPC tracing" />
            <FeatureFlagOption flag={FeatureFlags.AATestWeb} label="A/A Test for Web" />
            {isPlaywrightEnv() && <FeatureFlagOption flag={FeatureFlags.DummyFlagTest} label="Dummy Flag Test" />}
          </FeatureFlagGroup>
          <FeatureFlagGroup name="Misc"></FeatureFlagGroup>
          <FeatureFlagGroup name="Experiments">
            <Flex ml="$padding8">{/* add `ExperimentRow`s here */}</Flex>
          </FeatureFlagGroup>
          <FeatureFlagGroup name="Layers">
            <Flex ml="$padding8">
              <LayerRow value={Layers.SwapPage} />
            </Flex>
          </FeatureFlagGroup>
        </Flex>
        <Button onPress={window.location.reload} variant="default" emphasis="secondary" size="small" fill={false}>
          Reload
        </Button>
      </Flex>
    </Modal>
  )
}
