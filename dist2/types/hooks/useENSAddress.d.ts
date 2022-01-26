/**
 * Does a lookup for an ENS name to find its address.
 */
export default function useENSAddress(ensName?: string | null): {
    loading: boolean;
    address: string | null;
};
