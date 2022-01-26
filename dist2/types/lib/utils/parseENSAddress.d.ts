export default function parseENSAddress(ensAddress: string): {
    ensName: string;
    ensPath: string | undefined;
} | undefined;
