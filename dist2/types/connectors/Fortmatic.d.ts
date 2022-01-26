import { FortmaticConnector as FortmaticConnectorCore } from '@web3-react/fortmatic-connector';
export declare const OVERLAY_READY = "OVERLAY_READY";
export declare class FortmaticConnector extends FortmaticConnectorCore {
    activate(): Promise<{
        provider: any;
        chainId: any;
        account: any;
    }>;
}
