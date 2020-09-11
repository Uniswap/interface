const ROUTER_ADDRESS = process.env.REACT_APP_ROUTER_ADDRESS

if (typeof ROUTER_ADDRESS === 'undefined') throw new Error('ROUTER_ADDRESS is undefined')

export { ROUTER_ADDRESS }
