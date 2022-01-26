export declare enum ExplorerDataType {
    TRANSACTION = "transaction",
    TOKEN = "token",
    ADDRESS = "address",
    BLOCK = "block"
}
/**
 * Return the explorer link for the given data and data type
 * @param chainId the ID of the chain for which to return the data
 * @param data the data to return a link for
 * @param type the type of the data
 */
export declare function getExplorerLink(chainId: number, data: string, type: ExplorerDataType): string;
