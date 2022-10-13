import { SerializedEthereumRpcError } from './classes';
export declare const JSON_RPC_SERVER_ERROR_MESSAGE = "Unspecified server error.";
/**
 * Gets the message for a given code, or a fallback message if the code has
 * no corresponding message.
 */
export declare function getMessageFromCode(code: number, fallbackMessage?: string): string;
/**
 * Returns whether the given code is valid.
 * A code is only valid if it has a message.
 */
export declare function isValidCode(code: number): boolean;
/**
 * Serializes the given error to an Ethereum JSON RPC-compatible error object.
 * Merely copies the given error's values if it is already compatible.
 * If the given error is not fully compatible, it will be preserved on the
 * returned object's data.originalError property.
 */
export declare function serializeError(error: unknown, { fallbackError, shouldIncludeStack, }?: {
    fallbackError?: SerializedEthereumRpcError | undefined;
    shouldIncludeStack?: boolean | undefined;
}): SerializedEthereumRpcError;
