/**
 * Does a lookup for an ENS name to find its contenthash.
 */
export default function useENSContentHash(ensName?: string | null): {
    loading: boolean;
    contenthash: string | null;
};
