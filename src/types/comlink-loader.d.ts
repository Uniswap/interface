// types any imports from comlink-loader! as a web worker
declare module 'comlink-loader!*' {
  class WebpackWorker extends Worker {
    constructor()
  }

  export default WebpackWorker
}
