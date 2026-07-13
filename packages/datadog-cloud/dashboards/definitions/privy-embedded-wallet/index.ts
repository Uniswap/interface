import { DashboardDefinition } from '../../dashboard-types'
import { privyEmbeddedWalletRecoveryOprfDashboard } from './recovery-oprf-dashboard'
import { privyEmbeddedWalletSecurityDependenciesDashboard } from './security-dependencies-dashboard'
import { privyEmbeddedWalletServiceDashboard } from './service-dashboard'

export const privyEmbeddedWalletDashboards: DashboardDefinition[] = [
  privyEmbeddedWalletServiceDashboard,
  privyEmbeddedWalletRecoveryOprfDashboard,
  privyEmbeddedWalletSecurityDependenciesDashboard,
]
