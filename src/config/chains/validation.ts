/**
 * Chain Configuration Validation System
 *
 * This module provides production-ready validation for chain configurations
 * to ensure no zero addresses or invalid contract deployments are used.
 *
 * @module config/chains/validation
 */

/**
 * Validates that an address is not a zero address
 * @param address - The address to validate
 * @returns true if address is valid (non-zero)
 */
export function isValidAddress(address: string): boolean {
  return address !== '0x0000000000000000000000000000000000000000' && address.length === 42 && address.startsWith('0x')
}

/**
 * Validates that an address is not a zero address, throws if invalid
 * @param address - The address to validate
 * @param contractName - Name of the contract for error messages
 * @param chainName - Name of the chain for error messages
 * @throws Error if address is zero or invalid
 */
export function validateAddress(address: string, contractName: string, chainName: string): void {
  if (!isValidAddress(address)) {
    throw new Error(
      `Invalid ${contractName} address for ${chainName}: ${address}. ` +
        `Zero addresses indicate undeployed contracts and cannot be used in production. ` +
        `Please verify the contract deployment on the block explorer.`
    )
  }
}

/**
 * Chain contract addresses that need validation
 */
export interface ChainAddresses {
  // Core Protocol
  weth9: string
  factory: string

  // Periphery Contracts
  router: string
  positionManager: string
  quoterV2: string
  multicall: string
  tickLens: string

  // Additional Contracts
  v3Migrator: string
  v3Staker: string

  // Governance & Admin
  proxyAdmin: string
  nftDescriptorProxy: string
  nftDescriptorImplementation: string
  nftDescriptorLibrary: string
}

/**
 * Required contracts that must be validated for a chain to be enabled
 * These are the critical contracts needed for basic functionality
 */
export const REQUIRED_CONTRACTS: (keyof ChainAddresses)[] = [
  'weth9',
  'factory',
  'router',
  'positionManager',
  'quoterV2',
  'multicall',
]

/**
 * Optional contracts that are nice to have but not required
 */
export const OPTIONAL_CONTRACTS: (keyof ChainAddresses)[] = [
  'tickLens',
  'v3Migrator',
  'v3Staker',
  'proxyAdmin',
  'nftDescriptorProxy',
  'nftDescriptorImplementation',
  'nftDescriptorLibrary',
]

/**
 * Validation result with details about what passed/failed
 */
export interface ValidationResult {
  isValid: boolean
  chainName: string
  chainId: number
  errors: string[]
  warnings: string[]
  validatedContracts: string[]
  invalidContracts: string[]
}

/**
 * Validates all addresses in a chain configuration
 * @param addresses - The chain addresses to validate
 * @param chainName - Name of the chain (for error messages)
 * @param chainId - Chain ID (for error messages)
 * @param strict - If true, optional contracts are also required (default: false)
 * @returns Validation result with details
 */
export function validateChainAddresses(
  addresses: ChainAddresses,
  chainName: string,
  chainId: number,
  strict: boolean = false
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const validatedContracts: string[] = []
  const invalidContracts: string[] = []

  const contractsToValidate = strict ? [...REQUIRED_CONTRACTS, ...OPTIONAL_CONTRACTS] : REQUIRED_CONTRACTS

  // Validate required contracts
  for (const contractName of contractsToValidate) {
    const address = addresses[contractName]
    try {
      validateAddress(address, contractName, chainName)
      validatedContracts.push(contractName)
    } catch (error) {
      invalidContracts.push(contractName)
      errors.push(`${contractName}: ${address}`)
    }
  }

  // Warn about optional contracts with zero addresses (only if not strict)
  if (!strict) {
    for (const contractName of OPTIONAL_CONTRACTS) {
      const address = addresses[contractName]
      if (!isValidAddress(address)) {
        warnings.push(`Optional contract ${contractName} has zero address: ${address}`)
      } else {
        validatedContracts.push(contractName)
      }
    }
  }

  const isValid = errors.length === 0

  return {
    isValid,
    chainName,
    chainId,
    errors,
    warnings,
    validatedContracts,
    invalidContracts,
  }
}

/**
 * Validates chain addresses and throws if validation fails
 * Use this for production validation where you want to fail fast
 * @param addresses - The chain addresses to validate
 * @param chainName - Name of the chain
 * @param chainId - Chain ID
 * @param strict - If true, optional contracts are also required
 * @throws Error if validation fails with detailed error message
 */
export function validateChainAddressesOrThrow(
  addresses: ChainAddresses,
  chainName: string,
  chainId: number,
  strict: boolean = false
): void {
  const result = validateChainAddresses(addresses, chainName, chainId, strict)

  if (!result.isValid) {
    const errorMessage = [
      `\n========================================`,
      `CHAIN VALIDATION FAILED: ${chainName} (${chainId})`,
      `========================================`,
      ``,
      `The following required contracts have invalid (zero) addresses:`,
      ...result.errors.map((e) => `  - ${e}`),
      ``,
      `This chain cannot be enabled until all required contracts are deployed.`,
      ``,
      `Action Required:`,
      `1. Verify contract deployments on the block explorer`,
      `2. Update the chain configuration with correct addresses`,
      `3. Re-run validation`,
      ``,
      `To temporarily disable this chain:`,
      `- Remove it from the enabled chains list in registry.ts`,
      ``,
      `========================================`,
    ].join('\n')

    throw new Error(errorMessage)
  }

  // Log warnings if any
  if (result.warnings.length > 0) {
    console.warn(`\nWarnings for ${chainName} (${chainId}):`)
    result.warnings.forEach((w) => console.warn(`  - ${w}`))
  }
}

/**
 * Validates multiple chains and returns a summary
 * Useful for validating entire chain registry
 * @param chains - Array of chains to validate with their addresses, name, and ID
 * @param strict - If true, optional contracts are also required
 * @returns Array of validation results
 */
export function validateMultipleChains(
  chains: Array<{ addresses: ChainAddresses; chainName: string; chainId: number }>,
  strict: boolean = false
): ValidationResult[] {
  return chains.map((chain) => validateChainAddresses(chain.addresses, chain.chainName, chain.chainId, strict))
}

/**
 * Checks if all chains in a list passed validation
 * @param results - Array of validation results
 * @returns true if all chains are valid
 */
export function allChainsValid(results: ValidationResult[]): boolean {
  return results.every((r) => r.isValid)
}

/**
 * Gets a summary report of validation results
 * @param results - Array of validation results
 * @returns Formatted summary string
 */
export function getValidationSummary(results: ValidationResult[]): string {
  const total = results.length
  const valid = results.filter((r) => r.isValid).length
  const invalid = total - valid

  const summary = [
    `\n========================================`,
    `CHAIN VALIDATION SUMMARY`,
    `========================================`,
    `Total Chains: ${total}`,
    `Valid Chains: ${valid}`,
    `Invalid Chains: ${invalid}`,
    ``,
  ]

  if (invalid > 0) {
    summary.push(`Invalid Chains:`)
    results
      .filter((r) => !r.isValid)
      .forEach((r) => {
        summary.push(`  - ${r.chainName} (${r.chainId}): ${r.errors.length} errors`)
      })
    summary.push(``)
  }

  summary.push(`========================================`)

  return summary.join('\n')
}
