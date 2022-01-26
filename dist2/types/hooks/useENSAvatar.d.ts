/**
 * Returns the ENS avatar URI, if available.
 * Spec: https://gist.github.com/Arachnid/9db60bd75277969ee1689c8742b75182.
 */
export default function useENSAvatar(address?: string, enforceOwnership?: boolean): {
    avatar: string | null;
    loading: boolean;
};
