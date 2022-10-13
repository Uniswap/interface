declare type NotifyCallback = () => void;
declare type NotifyFunction = (callback: () => void) => void;
declare type BatchNotifyFunction = (callback: () => void) => void;
export declare function createNotifyManager(): {
    readonly batch: <T>(callback: () => T) => T;
    readonly batchCalls: <T_1 extends Function>(callback: T_1) => T_1;
    readonly schedule: (callback: NotifyCallback) => void;
    readonly setNotifyFunction: (fn: NotifyFunction) => void;
    readonly setBatchNotifyFunction: (fn: BatchNotifyFunction) => void;
};
export declare const notifyManager: {
    readonly batch: <T>(callback: () => T) => T;
    readonly batchCalls: <T_1 extends Function>(callback: T_1) => T_1;
    readonly schedule: (callback: NotifyCallback) => void;
    readonly setNotifyFunction: (fn: NotifyFunction) => void;
    readonly setBatchNotifyFunction: (fn: BatchNotifyFunction) => void;
};
export {};
