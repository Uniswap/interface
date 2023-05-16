import type { TokenInfo, TokenList } from '@uniswap/token-lists'
import type { ValidateFunction } from 'ajv'

import { retry } from './retry'

enum ValidationSchema {
  LIST = 'list',
  TOKENS = 'tokens',
}

function getValidationErrors(validate: ValidateFunction | undefined): string {
  return (
    validate?.errors?.map((error) => [error.instancePath, error.message].filter(Boolean).join(' ')).join('; ') ??
    'unknown error'
  )
}

async function validate(schema: ValidationSchema, data: unknown): Promise<unknown> {
  let validatorImport
  switch (schema) {
    case ValidationSchema.LIST:
      validatorImport = await retry(() => import('utils/__generated__/validateTokenList'))
      break
    case ValidationSchema.TOKENS:
      validatorImport = await retry(() => import('utils/__generated__/validateTokens'))
      break
    default:
      throw new Error('No validation function specified for token list schema')
  }

  const [, validatorModule] = await Promise.all([retry(() => import('ajv')), validatorImport])
  const validator = validatorModule.default as ValidateFunction
  if (validator?.(data)) {
    return data
  }
  throw new Error(getValidationErrors(validator))
}

/**
 * Validates an array of tokens.
 * @param json the TokenInfo[] to validate
 */
export async function validateTokens(json: TokenInfo[]): Promise<TokenInfo[]> {
  try {
    await validate(ValidationSchema.TOKENS, { tokens: json })
    return json
  } catch (error) {
    throw new Error(`Tokens failed validation: ${error.message}`)
  }
}

/**
 * Validates a token list.
 * @param json the TokenList to validate
 */
export async function validateTokenList(json: TokenList): Promise<TokenList> {
  try {
    await validate(ValidationSchema.LIST, json)
    return json
  } catch (error) {
    throw new Error(`Token list failed validation: ${error.message}`)
  }
}
