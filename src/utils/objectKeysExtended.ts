// Helps overcoming Object.keys string[] return type
// https://stackoverflow.com/questions/52856496/typescript-object-keys-return-string

export const getObjectKeys = Object.keys as <T extends object>(obj: T) => Array<keyof T>
