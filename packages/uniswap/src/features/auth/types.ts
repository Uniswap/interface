export type AuthTrigger = (args: { successCallback: () => void; failureCallback: () => void }) => Promise<void>
