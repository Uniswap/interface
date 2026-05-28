import { ViewRecoveryPhraseScreen } from 'src/app/features/settings/SettingsRecoveryPhraseScreen/ViewRecoveryPhraseScreen'
import { ForceUpgrade } from 'wallet/src/features/forceUpgrade/ForceUpgrade'

function SeedPhraseModalContent({ mnemonicId, onDismiss }: { mnemonicId: string; onDismiss: () => void }): JSX.Element {
  return <ViewRecoveryPhraseScreen mnemonicId={mnemonicId} showRemoveButton={false} onBackClick={onDismiss} />
}

export function ForceUpgradeModal(): JSX.Element {
  return <ForceUpgrade SeedPhraseModalContent={SeedPhraseModalContent} />
}
