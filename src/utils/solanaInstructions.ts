import { ChainId, Currency, CurrencyAmount, WETH } from '@kyberswap/ks-sdk-core'
import * as anchor from '@project-serum/anchor'
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Account,
  NATIVE_MINT,
  TOKEN_PROGRAM_ID,
  TokenInvalidMintError,
  TokenInvalidOwnerError,
  createCloseAccountInstruction,
  createSyncNativeInstruction,
  getAccount,
  getAssociatedTokenAddress,
} from '@solana/spl-token'
import {
  Commitment,
  Connection,
  PublicKey,
  SYSVAR_RENT_PUBKEY,
  SystemProgram,
  TransactionInstruction,
} from '@solana/web3.js'

function createIdempotentAssociatedTokenAccountInstruction(
  payer: PublicKey,
  associatedToken: PublicKey,
  owner: PublicKey,
  mint: PublicKey,
  programId = TOKEN_PROGRAM_ID,
  associatedTokenProgramId = ASSOCIATED_TOKEN_PROGRAM_ID,
): TransactionInstruction {
  const keys = [
    { pubkey: payer, isSigner: true, isWritable: true },
    { pubkey: associatedToken, isSigner: false, isWritable: true },
    { pubkey: owner, isSigner: false, isWritable: false },
    { pubkey: mint, isSigner: false, isWritable: false },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    { pubkey: programId, isSigner: false, isWritable: false },
    { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
  ]

  return new TransactionInstruction({
    keys,
    programId: associatedTokenProgramId,
    data: Buffer.from([1]),
  })
}

async function getAssociatedTokenAccount(
  connection: Connection,
  mint: PublicKey,
  owner: PublicKey,
  allowOwnerOffCurve = false,
  commitment: Commitment = 'processed',
  programId = TOKEN_PROGRAM_ID,
  associatedTokenProgramId = ASSOCIATED_TOKEN_PROGRAM_ID,
): Promise<Account | null> {
  const associatedToken = await getAssociatedTokenAddress(
    mint,
    owner,
    allowOwnerOffCurve,
    programId,
    associatedTokenProgramId,
  )

  // This is the optimal logic, considering TX fee, client-side computation, RPC roundtrips and guaranteed idempotent.
  // Sadly we can't do this atomically.
  let account: Account
  try {
    account = await getAccount(connection, associatedToken, commitment, programId)
  } catch (error: unknown) {
    return null
  }

  if (!account.mint.equals(mint)) throw new TokenInvalidMintError()
  if (!account.owner.equals(owner)) throw new TokenInvalidOwnerError()

  return account
}

export const createWrapSOLInstructions = async (
  connection: Connection,
  account: PublicKey,
  amountIn: CurrencyAmount<Currency>,
): Promise<TransactionInstruction[]> => {
  const associatedTokenAccount = await getAssociatedTokenAddress(NATIVE_MINT, account)
  const createWSOLIx = await checkAndCreateAtaInstruction(connection, account, amountIn.currency)

  const transferIx = SystemProgram.transfer({
    fromPubkey: account,
    toPubkey: associatedTokenAccount,
    lamports: BigInt(amountIn.quotient.toString()),
  })

  const syncNativeIx = createSyncNativeInstruction(associatedTokenAccount)
  if (createWSOLIx) return [createWSOLIx, transferIx, syncNativeIx]
  return [transferIx, syncNativeIx]
}

export const checkAndCreateWrapSOLInstructions = async (
  connection: Connection,
  account: PublicKey,
  amountIn: CurrencyAmount<Currency>,
): Promise<TransactionInstruction[] | null> => {
  if (amountIn.currency.isNative) {
    const associatedTokenAccount = await getAssociatedTokenAddress(NATIVE_MINT, account)
    let WSOLBalance: anchor.web3.RpcResponseAndContext<anchor.web3.TokenAmount> | undefined = undefined
    try {
      WSOLBalance = await connection.getTokenAccountBalance(associatedTokenAccount)
    } catch {}
    const WSOLAmount = CurrencyAmount.fromRawAmount(amountIn.currency, WSOLBalance ? WSOLBalance.value.amount : '0')
    if (WSOLAmount.lessThan(amountIn)) {
      const ixs = await createWrapSOLInstructions(connection, account, amountIn)
      return ixs
    }
  }
  return null
}

export const checkAndCreateAtaInstruction = async (
  connection: Connection,
  account: PublicKey,
  currencyIn: Currency,
): Promise<TransactionInstruction | null> => {
  const mint = new PublicKey(currencyIn.wrapped.address)
  try {
    const ata = await getAssociatedTokenAccount(connection, mint, account, true)
    if (!ata) throw Error('Create ata')
  } catch (error) {
    const associatedTokenAccount = await getAssociatedTokenAddress(mint, account)

    const createAtaIx = createIdempotentAssociatedTokenAccountInstruction(
      account,
      associatedTokenAccount,
      account,
      mint,
    )

    return createAtaIx
  }
  return null
}

export const createUnwrapSOLInstruction = async (account: PublicKey): Promise<TransactionInstruction> => {
  const associatedTokenAccount = await getAssociatedTokenAddress(NATIVE_MINT, account)
  const unwrapSOLIx = createCloseAccountInstruction(associatedTokenAccount, account, account)
  return unwrapSOLIx
}

export const checkAndCreateUnwrapSOLInstruction = async (
  connection: Connection,
  account: PublicKey,
): Promise<TransactionInstruction | null> => {
  try {
    const ata = await getAssociatedTokenAccount(connection, new PublicKey(WETH[ChainId.SOLANA].address), account, true)
    if (ata) {
      return await createUnwrapSOLInstruction(account)
    }
  } catch {}
  return null
}
