export declare type cliCommand = (argv?: string[]) => void;
export declare const commands: {
    [command: string]: () => Promise<cliCommand>;
};
