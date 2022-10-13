import { notifyManager } from "../core/index.mjs";
import { unstable_batchedUpdates } from "./reactBatchedUpdates.mjs";
notifyManager.setBatchNotifyFunction(unstable_batchedUpdates);