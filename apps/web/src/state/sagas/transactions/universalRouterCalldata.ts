import { AbiCoder } from '@ethersproject/abi'
import { getAddress } from '@ethersproject/address'

// Universal Router Command Constants
const UNIVERSAL_ROUTER_COMMANDS = {
  V3_SWAP_EXACT_IN: 0x00,
  V3_SWAP_EXACT_OUT: 0x01,
  SWEEP: 0x04,
  TRANSFER: 0x05,
  PAY_PORTION: 0x06,
  // PAY_PORTION_FULL_PRECISION (0x07) was added as in universal-router upgrade. The RigoBlock AUniswapDecoder.sol does now support it until upgrade.
  // Temporary fix: detect and downgrade to PAY_PORTION (0x06) with bips conversion.
  // TODO: Remove once the AUniswapRouter adapter is upgraded to support the new UR.
  PAY_PORTION_FULL_PRECISION: 0x07,
  V2_SWAP_EXACT_IN: 0x08,
  V2_SWAP_EXACT_OUT: 0x09,
  // WRAP_ETH: sends ETH → WETH; recipient is normally ADDRESS_THIS so WETH stays in the router.
  // Older AUniswapRouter deployments call an external function on every decoded recipient and
  // therefore revert on the ADDRESS_THIS precompile (0x2). Replace it with the pool so the pool
  // receives the WETH directly.  The downstream V3/V2 swap must then use payerIsUser=true so
  // the UniversalRouter pulls WETH from the pool via Permit2 (AUniswapRouter sets up the
  // allowance in _safeApproveTokensIn before forwarding to the UR).
  WRAP_ETH: 0x0b,
  UNWRAP_WETH: 0x0c,
  BALANCE_CHECK_ERC20: 0x0e, // 14 in decimal - not supported on some chains/routers
  V4_SWAP: 0x10,
}

// V4 Universal Router Action Constants
const V4_ACTIONS = {
  TAKE: 0x0e, // 14 in decimal
  TAKE_PORTION: 0x10, // 16 in decimal
}

// ActionConstants from V4 periphery
const ACTION_CONSTANTS = {
  MSG_SENDER: '0x0000000000000000000000000000000000000001',
  ADDRESS_THIS: '0x0000000000000000000000000000000000000002',
}

function shouldReplaceRecipient(recipient: string, smartPoolAddress: string): boolean {
  const normalizedRecipient = getAddress(recipient).toLowerCase()
  const normalizedSmartPool = getAddress(smartPoolAddress).toLowerCase()

  // Don't replace if already the smart pool
  if (normalizedRecipient === normalizedSmartPool) {
    return false
  }

  // Don't replace ActionConstants (MSG_SENDER, ADDRESS_THIS)
  if (
    normalizedRecipient === ACTION_CONSTANTS.MSG_SENDER.toLowerCase() ||
    normalizedRecipient === ACTION_CONSTANTS.ADDRESS_THIS.toLowerCase()
  ) {
    return false
  }

  // Replace all other recipients (including Trading API fee recipients)
  return true
}

export function modifyV4ExecuteCalldata(calldata: string, smartPoolAddress: string): string {
  try {
    // Decode the execute(bytes commands, bytes[] inputs, uint256 deadline) calldata first
    const abiCoder = new AbiCoder()
    const decoded = abiCoder.decode(['bytes', 'bytes[]', 'uint256'], calldata)

    let [commands, inputs, deadline] = decoded

    // Process commands to identify which inputs need modification
    // Keep commandsBytes as the source of truth for command modifications
    const commandsBytes = commands.startsWith('0x')
      ? new Uint8Array(Buffer.from(commands.slice(2), 'hex'))
      : new Uint8Array(Buffer.from(commands, 'hex'))

    const modifiedInputs = [...inputs]
    let commandsWasModified = false
    let inputsWereModified = false

    // Process each command and its corresponding input
    for (let i = 0; i < commandsBytes.length && i < inputs.length; i++) {
      const command = commandsBytes[i]
      const input = inputs[i]

      if (command === UNIVERSAL_ROUTER_COMMANDS.SWEEP) {
        // SWEEP command: abi.encode(token, recipient, amountMinimum)
        try {
          const [token, recipient, amountMinimum] = abiCoder.decode(['address', 'address', 'uint256'], input)

          if (shouldReplaceRecipient(recipient, smartPoolAddress)) {
            const newInput = abiCoder.encode(
              ['address', 'address', 'uint256'],
              [token, smartPoolAddress, amountMinimum],
            )
            modifiedInputs[i] = newInput
            inputsWereModified = true
          }
        } catch (error) {
          console.warn(`Failed to decode SWEEP command ${i}:`, error)
        }
      } else if (command === UNIVERSAL_ROUTER_COMMANDS.PAY_PORTION) {
        // PAY_PORTION command: abi.encode(token, recipient, bips)
        try {
          const [token, recipient, bips] = abiCoder.decode(['address', 'address', 'uint256'], input)

          if (shouldReplaceRecipient(recipient, smartPoolAddress)) {
            const newInput = abiCoder.encode(['address', 'address', 'uint256'], [token, smartPoolAddress, bips])
            modifiedInputs[i] = newInput
            inputsWereModified = true
          }
        } catch (error) {
          console.warn(`Failed to decode PAY_PORTION command ${i}:`, error)
        }
      } else if (command === UNIVERSAL_ROUTER_COMMANDS.PAY_PORTION_FULL_PRECISION) {
        // PAY_PORTION_FULL_PRECISION (0x07) command: abi.encode(token, recipient, portion)
        // where portion uses 1e18 precision (1e18 = 100%).
        // Temporary fix pending AUniswapRouter adapter upgrade: the old UR does not recognise 0x07
        // (it may skip or revert depending on ALLOW_REVERT flag). Downgrade to PAY_PORTION (0x06)
        // so the fee is correctly routed on the old UR. Precision loss is at most 1 bip (~0.01%).
        // TODO: remove once the AUniswapRouter adapter is upgraded to the new UR.
        try {
          const [token, recipient, portion] = abiCoder.decode(['address', 'address', 'uint256'], input)
          const portionBigInt = BigInt(portion.toString())
          // Convert from 1e18 precision to basis points (10000 = 100%)
          const bips = (portionBigInt * BigInt(10000)) / BigInt('1000000000000000000')
          const finalRecipient = shouldReplaceRecipient(recipient, smartPoolAddress) ? smartPoolAddress : recipient
          const newInput = abiCoder.encode(['address', 'address', 'uint256'], [token, finalRecipient, bips])
          modifiedInputs[i] = newInput
          // IMPORTANT: Downgrade the command byte from 0x07 to 0x06
          commandsBytes[i] = UNIVERSAL_ROUTER_COMMANDS.PAY_PORTION
          commandsWasModified = true
          inputsWereModified = true
        } catch (error) {
          console.warn(`Failed to decode PAY_PORTION_FULL_PRECISION command ${i}:`, error)
        }
      } else if (command === UNIVERSAL_ROUTER_COMMANDS.TRANSFER) {
        // TRANSFER command: abi.encode(token, recipient, amount)
        // This command transfers tokens to an arbitrary address (often the Uniswap fee collector)
        // We need to redirect this to the smart pool address to prevent funds from leaving the pool
        try {
          const [token, recipient, amount] = abiCoder.decode(['address', 'address', 'uint256'], input)

          if (shouldReplaceRecipient(recipient, smartPoolAddress)) {
            const newInput = abiCoder.encode(['address', 'address', 'uint256'], [token, smartPoolAddress, amount])
            modifiedInputs[i] = newInput
            inputsWereModified = true
          }
        } catch (error) {
          console.warn(`Failed to decode TRANSFER command ${i}:`, error)
        }
      } else if (command === UNIVERSAL_ROUTER_COMMANDS.WRAP_ETH) {
        // WRAP_ETH: abi.encode(address recipient, uint256 amount)
        // ActionConstants.ADDRESS_THIS (address(2)) and MSG_SENDER (address(1)) are explicitly
        // accepted by AUniswapRouter._processRecipients — do not replace them.
        // Only replace an unexpected user EOA that would be rejected.
        try {
          const [recipient, amount] = abiCoder.decode(['address', 'uint256'], input)
          if (shouldReplaceRecipient(recipient, smartPoolAddress)) {
            const newInput = abiCoder.encode(['address', 'uint256'], [smartPoolAddress, amount])
            modifiedInputs[i] = newInput
            inputsWereModified = true
          }
        } catch (error) {
          console.warn(`Failed to decode WRAP_ETH command ${i}:`, error)
        }
      } else if (command === UNIVERSAL_ROUTER_COMMANDS.UNWRAP_WETH) {
        // UNWRAP_WETH: abi.encode(address recipient, uint256 amountMin)
        try {
          const [recipient, amountMin] = abiCoder.decode(['address', 'uint256'], input)
          if (shouldReplaceRecipient(recipient, smartPoolAddress)) {
            const newInput = abiCoder.encode(['address', 'uint256'], [smartPoolAddress, amountMin])
            modifiedInputs[i] = newInput
            inputsWereModified = true
          }
        } catch (error) {
          console.warn(`Failed to decode UNWRAP_WETH command ${i}:`, error)
        }
      } else if (command === UNIVERSAL_ROUTER_COMMANDS.V3_SWAP_EXACT_IN) {
        // V3_SWAP_EXACT_IN: abi.encode(address recipient, uint256 amountIn, uint256 amountOutMin,
        //                              bytes path, bool payerIsUser)
        // AUniswapRouter._processRecipients only allows address(this) (the pool), MSG_SENDER
        // (address(1)), and ADDRESS_THIS (address(2)). User EOA addresses are rejected.
        // shouldReplaceRecipient already skips address(1) and address(2), so this correctly
        // replaces only bare user addresses with the smart pool.
        try {
          const [recipient, amountIn, amountOutMin, path, payerIsUser] = abiCoder.decode(
            ['address', 'uint256', 'uint256', 'bytes', 'bool'],
            input,
          )
          if (shouldReplaceRecipient(recipient, smartPoolAddress)) {
            const newInput = abiCoder.encode(
              ['address', 'uint256', 'uint256', 'bytes', 'bool'],
              [smartPoolAddress, amountIn, amountOutMin, path, payerIsUser],
            )
            modifiedInputs[i] = newInput
            inputsWereModified = true
          }
        } catch (error) {
          console.warn(`Failed to decode V3_SWAP_EXACT_IN command ${i}:`, error)
        }
      } else if (command === UNIVERSAL_ROUTER_COMMANDS.V3_SWAP_EXACT_OUT) {
        // V3_SWAP_EXACT_OUT: abi.encode(address recipient, uint256 amountOut, uint256 amountInMax,
        //                               bytes path, bool payerIsUser)
        try {
          const [recipient, amountOut, amountInMax, path, payerIsUser] = abiCoder.decode(
            ['address', 'uint256', 'uint256', 'bytes', 'bool'],
            input,
          )
          if (shouldReplaceRecipient(recipient, smartPoolAddress)) {
            const newInput = abiCoder.encode(
              ['address', 'uint256', 'uint256', 'bytes', 'bool'],
              [smartPoolAddress, amountOut, amountInMax, path, payerIsUser],
            )
            modifiedInputs[i] = newInput
            inputsWereModified = true
          }
        } catch (error) {
          console.warn(`Failed to decode V3_SWAP_EXACT_OUT command ${i}:`, error)
        }
      } else if (command === UNIVERSAL_ROUTER_COMMANDS.V2_SWAP_EXACT_IN) {
        // V2_SWAP_EXACT_IN: abi.encode(address recipient, uint256 amountIn, uint256 amountOutMin,
        //                              address[] path, bool payerIsUser)
        try {
          const [recipient, amountIn, amountOutMin, path, payerIsUser] = abiCoder.decode(
            ['address', 'uint256', 'uint256', 'address[]', 'bool'],
            input,
          )
          if (shouldReplaceRecipient(recipient, smartPoolAddress)) {
            const newInput = abiCoder.encode(
              ['address', 'uint256', 'uint256', 'address[]', 'bool'],
              [smartPoolAddress, amountIn, amountOutMin, path, payerIsUser],
            )
            modifiedInputs[i] = newInput
            inputsWereModified = true
          }
        } catch (error) {
          console.warn(`Failed to decode V2_SWAP_EXACT_IN command ${i}:`, error)
        }
      } else if (command === UNIVERSAL_ROUTER_COMMANDS.V2_SWAP_EXACT_OUT) {
        // V2_SWAP_EXACT_OUT: abi.encode(address recipient, uint256 amountOut, uint256 amountInMax,
        //                               address[] path, bool payerIsUser)
        try {
          const [recipient, amountOut, amountInMax, path, payerIsUser] = abiCoder.decode(
            ['address', 'uint256', 'uint256', 'address[]', 'bool'],
            input,
          )
          if (shouldReplaceRecipient(recipient, smartPoolAddress)) {
            const newInput = abiCoder.encode(
              ['address', 'uint256', 'uint256', 'address[]', 'bool'],
              [smartPoolAddress, amountOut, amountInMax, path, payerIsUser],
            )
            modifiedInputs[i] = newInput
            inputsWereModified = true
          }
        } catch (error) {
          console.warn(`Failed to decode V2_SWAP_EXACT_OUT command ${i}:`, error)
        }
      } else if (command === UNIVERSAL_ROUTER_COMMANDS.V4_SWAP) {
        // V4_SWAP command: process V4 actions within this input
        try {
          // Each input should be encoded as (bytes actions, bytes[] params)
          const [actions, params] = abiCoder.decode(['bytes', 'bytes[]'], input)

          // The actions bytes should be the actual action sequence, not encoded
          // Convert the decoded bytes to a Uint8Array for processing
          const actionsBytes = actions.startsWith('0x')
            ? new Uint8Array(Buffer.from(actions.slice(2), 'hex'))
            : new Uint8Array(Buffer.from(actions, 'hex'))

          const modifiedParams = [...params]
          let v4InputWasModified = false

          // Process each V4 action
          for (let j = 0; j < actionsBytes.length; j++) {
            const actionType = actionsBytes[j]

            if (actionType === V4_ACTIONS.TAKE || actionType === V4_ACTIONS.TAKE_PORTION) {
              const paramCalldata = params[j]

              if (actionType === V4_ACTIONS.TAKE) {
                // TAKE action: abi.encode(currency, recipient, amount)
                try {
                  const [currency, recipient, amount] = abiCoder.decode(
                    ['address', 'address', 'uint256'],
                    paramCalldata,
                  )

                  if (shouldReplaceRecipient(recipient, smartPoolAddress)) {
                    const newParams = abiCoder.encode(
                      ['address', 'address', 'uint256'],
                      [currency, smartPoolAddress, amount],
                    )
                    modifiedParams[j] = newParams
                    v4InputWasModified = true
                  }
                } catch (error) {
                  console.warn(`Failed to decode V4 TAKE action ${j} in command ${i}:`, error)
                }
              } else if (actionType === V4_ACTIONS.TAKE_PORTION) {
                // TAKE_PORTION action: abi.encode(currency, recipient, bips)
                try {
                  const [currency, recipient, bips] = abiCoder.decode(['address', 'address', 'uint256'], paramCalldata)

                  if (shouldReplaceRecipient(recipient, smartPoolAddress)) {
                    const newParams = abiCoder.encode(
                      ['address', 'address', 'uint256'],
                      [currency, smartPoolAddress, bips],
                    )
                    modifiedParams[j] = newParams
                    v4InputWasModified = true
                  }
                } catch (error) {
                  console.warn(`Failed to decode V4 TAKE_PORTION action ${j} in command ${i}:`, error)
                }
              }
            }
          }

          if (v4InputWasModified) {
            // Re-encode this V4_SWAP input with modified params
            const modifiedInput = abiCoder.encode(['bytes', 'bytes[]'], [actions, modifiedParams])
            modifiedInputs[i] = modifiedInput
            inputsWereModified = true
          }
        } catch (error) {
          console.warn(`Failed to decode V4_SWAP command ${i}:`, error)
        }
      }
    }

    // Only re-encode if something actually changed
    if (!commandsWasModified && !inputsWereModified) {
      return calldata
    }

    // Reconstruct the commands hex string ONCE at the end after all modifications
    const finalCommands = commandsWasModified ? '0x' + Buffer.from(commandsBytes).toString('hex') : commands

    // Re-encode the entire calldata with potentially modified commands and inputs
    return abiCoder.encode(['bytes', 'bytes[]', 'uint256'], [finalCommands, modifiedInputs, deadline])
  } catch (error) {
    console.error('Error modifying V4 calldata:', error)
    throw error
  }
}

/**
 * Strips BALANCE_CHECK_ERC20 commands from Universal Router calldata
 * 
 * RigoBlock smart pools handle balance checks internally, and some chain-specific
 * Universal Router deployments may not support this command.
 * This function removes any BALANCE_CHECK_ERC20 commands from the calldata.
 * 
 * @param calldata - The Universal Router execute calldata (with or without function selector)
 * @returns The modified calldata without BALANCE_CHECK_ERC20 commands
 */
export function stripBalanceCheckERC20(calldata: string): string {
  try {
    const abiCoder = new AbiCoder()
    
    // Check if this has a function selector (starts with 0x and has selector)
    // execute(bytes,bytes[],uint256) selector is 0x3593564c
    const hasSelector = calldata.toLowerCase().startsWith('0x3593564c')
    const dataWithoutSelector = hasSelector ? '0x' + calldata.slice(10) : calldata
    const functionSelector = hasSelector ? calldata.slice(0, 10) : ''
    
    const decoded = abiCoder.decode(['bytes', 'bytes[]', 'uint256'], dataWithoutSelector)
    const [commands, inputs, deadline] = decoded

    // Process commands to identify BALANCE_CHECK_ERC20 and filter them out
    const commandsBytes = commands.startsWith('0x')
      ? new Uint8Array(Buffer.from(commands.slice(2), 'hex'))
      : new Uint8Array(Buffer.from(commands, 'hex'))

    const filteredCommands: number[] = []
    const filteredInputs: string[] = []

    // Process each command and filter out BALANCE_CHECK_ERC20
    for (let i = 0; i < commandsBytes.length && i < inputs.length; i++) {
      const command = commandsBytes[i]
      
      if (command !== UNIVERSAL_ROUTER_COMMANDS.BALANCE_CHECK_ERC20) {
        filteredCommands.push(command)
        filteredInputs.push(inputs[i])
      } else {
        console.info(`Stripped BALANCE_CHECK_ERC20 command at index ${i} for RigoBlock smart pool`)
      }
    }

    // If nothing was filtered, return original calldata
    if (filteredCommands.length === commandsBytes.length) {
      return calldata
    }

    // Re-encode the commands bytes
    const newCommandsBytes = new Uint8Array(filteredCommands)
    const newCommandsHex = '0x' + Buffer.from(newCommandsBytes).toString('hex')

    // Re-encode the entire calldata
    const newCalldata = abiCoder.encode(['bytes', 'bytes[]', 'uint256'], [newCommandsHex, filteredInputs, deadline])

    // Add function selector back if it was present
    return functionSelector ? functionSelector + newCalldata.slice(2) : newCalldata
  } catch (error) {
    console.warn('Failed to strip BALANCE_CHECK_ERC20 from calldata:', error)
    // Return original calldata if we can't process it
    return calldata
  }
}
