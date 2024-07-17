import EventEmitter from 'eventemitter3'
import { GlobalErrorEvent } from 'src/app/events/constants'

class GlobalEventEmitter extends EventEmitter<GlobalErrorEvent> {}
export const globalEventEmitter = new GlobalEventEmitter()
