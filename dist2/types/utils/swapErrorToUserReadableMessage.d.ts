import { ReactNode } from 'react';
/**
 * This is hacking out the revert reason from the ethers provider thrown error however it can.
 * This object seems to be undocumented by ethers.
 * @param error an error from the ethers provider
 */
export declare function swapErrorToUserReadableMessage(error: any): ReactNode;
