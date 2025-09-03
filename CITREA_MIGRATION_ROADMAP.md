# 🚀 JuiceSwap → Citrea-Only Migration Roadmap

## 📊 **PROJECT OVERVIEW**

**Goal:** Transform multi-chain Uniswap interface into Citrea-only JuiceSwap DEX

**Complexity:** HIGH - Complete architectural refactoring required

**Estimated Timeline:** 2-3 weeks intensive development

**Risk Level:** MEDIUM-HIGH - Breaking changes to core functionality

---

## 🗓️ **MIGRATION PHASES**

### **PHASE 1: DEPENDENCY ANALYSIS & CLEANUP** 
*Duration: 3-4 days*

#### **1.1 Package.json Dependency Audit**
```json
// REMOVE - Multi-Chain Dependencies
"@solana/web3.js": "1.92.0"                    ❌ Remove Solana
"@solana/wallet-adapter-react": "0.15.39"      ❌ Remove Solana Wallets  
"@binance/w3w-wagmi-connector-v2": "1.2.5"     ❌ Remove Binance Connector

// KEEP - Core Functionality  
"@uniswap/sdk-core": "7.7.2"                   ✅ Keep (configure for Citrea)
"@uniswap/v2-sdk": "4.15.2"                    ✅ Keep (if V2 deployed)
"@uniswap/v3-sdk": "3.25.2"                    ✅ Keep (if V3 deployed)
"wagmi": "2.15.5"                               ✅ Keep (configure for Citrea)
"viem": "2.30.5"                                ✅ Keep (configure for Citrea)
```

#### **1.2 Chain-Specific Code Removal**
- [ ] Remove Solana-specific components and logic
- [ ] Remove cross-chain bridge functionality  
- [ ] Remove multi-chain routing logic
- [ ] Clean up unused chain imports

#### **1.3 Bundle Size Analysis**
- [ ] Analyze bundle impact of removed dependencies
- [ ] Estimate size reduction (expected: 20-30% smaller)

---

### **PHASE 2: CHAIN CONFIGURATION & NETWORK SETUP**
*Duration: 2-3 days*

#### **2.1 Citrea Chain Integration**
```typescript
// packages/uniswap/src/features/chains/types.ts
export enum UniverseChainId {
  Citrea = 62298,  // Citrea Mainnet Chain ID
  CitreaTestnet = 5115,  // Citrea Testnet Chain ID  
  // Remove all other chains
}
```

#### **2.2 Chain Information Setup**
Create: `packages/uniswap/src/features/chains/evm/info/citrea.ts`
```typescript
export const CITREA_CHAIN_INFO: UniverseChainInfo = {
  id: UniverseChainId.Citrea,
  name: 'Citrea',
  shortName: 'citrea',
  urlParam: 'citrea',
  nativeCurrency: {
    name: 'Citrea Bitcoin',
    symbol: 'CBTC',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ['https://rpc.citrea.xyz'] },
    public: { http: ['https://rpc.citrea.xyz'] },
  },
  blockExplorers: {
    default: { 
      name: 'Citrea Explorer', 
      url: 'https://explorer.citrea.xyz' 
    },
  },
  // ... other config
}
```

#### **2.3 Network Configuration Updates**
- [ ] Update `chainInfo.ts` to only include Citrea
- [ ] Remove all other chain configurations
- [ ] Update `ORDERED_CHAINS` to single chain
- [ ] Configure RPC endpoints for Citrea

#### **2.4 Wallet Configuration**
- [ ] Configure wagmi for Citrea network only
- [ ] Update wallet connectors for Citrea support
- [ ] Remove unsupported wallet types

---

### **PHASE 3: PROTOCOL CONTRACTS & TOKEN LISTS**
*Duration: 4-5 days*

#### **3.1 Contract Deployment Requirements**
**⚠️ CRITICAL: These contracts must be deployed on Citrea:**

```typescript
// Required Uniswap Protocol Contracts:
- UniswapV2Factory
- UniswapV2Router02  
- UniswapV3Factory
- UniswapV3SwapRouter
- UniswapV4PoolManager (if using V4)
- Multicall3
- Permit2
```

#### **3.2 Contract Address Configuration**
Update: `packages/uniswap/src/constants/addresses.ts`
```typescript
export const UNI_ADDRESSES: AddressMap = {
  [UniverseChainId.Citrea]: '0x...', // UNI token on Citrea
}

export const V2_FACTORY_ADDRESSES: AddressMap = {
  [UniverseChainId.Citrea]: '0x...', // V2 Factory on Citrea
}

export const V3_CORE_FACTORY_ADDRESSES: AddressMap = {
  [UniverseChainId.Citrea]: '0x...', // V3 Factory on Citrea  
}
```

#### **3.3 Token Lists for Citrea**
Create: `apps/web/src/constants/citrea-tokens.ts`
```typescript
export const CITREA_TOKENS = {
  CBTC: new Token(UniverseChainId.Citrea, '0x...', 18, 'CBTC', 'Citrea Bitcoin'),
  // Other Citrea tokens
}
```

#### **3.4 Liquidity Pool Configuration**
- [ ] Configure default pools for Citrea
- [ ] Set up token pair configurations
- [ ] Update pool discovery logic for single chain

---

### **PHASE 4: UI/UX SINGLE-CHAIN MODIFICATIONS**
*Duration: 3-4 days*

#### **4.1 Chain Selector Removal/Modification**
```typescript
// apps/web/src/components/NavBar/ChainSelector/index.tsx
// OPTIONS:
// A) Complete removal - cleaner UI
// B) Show "Citrea" badge only - for branding
// C) Hide but keep functionality - for future expansion
```

#### **4.2 Network-Related UI Updates**
- [ ] Remove network switching prompts
- [ ] Remove "unsupported network" warnings  
- [ ] Update network badges to show Citrea
- [ ] Remove chain logos for other networks

#### **4.3 Multi-Chain Text Updates**
Update: `packages/uniswap/src/i18n/locales/source/en-US.json`
```json
// FROM:
"title.swappingMadeSimple": "...on Ethereum, Base, Arbitrum, Polygon..."
"landing.swapBody": "...across 14 chains..."

// TO:  
"title.swappingMadeSimple": "...on Citrea blockchain..."
"landing.swapBody": "...on Citrea, the Bitcoin L2..."
```

#### **4.4 Landing Page Updates**
- [ ] Update hero section to mention Citrea
- [ ] Replace multi-chain token examples with Citrea tokens
- [ ] Update feature descriptions for single-chain focus

---

### **PHASE 5: DEVELOPMENT ENVIRONMENT & TOOLING**
*Duration: 2-3 days*

#### **5.1 Anvil/Foundry Setup for Citrea**
Update: `apps/web/package.json`
```json
{
  "scripts": {
    // REMOVE:
    "anvil:mainnet": "...ethereum fork...",
    "anvil:base": "...base fork...",
    
    // ADD:
    "anvil:citrea": "anvil --fork-url https://rpc.citrea.xyz --chain-id 62298",
    "anvil:citrea-testnet": "anvil --fork-url https://rpc.testnet.citrea.xyz --chain-id 5115"
  }
}
```

#### **5.2 Environment Variables**
Create: `apps/web/.env.citrea`
```bash
REACT_APP_CITREA_RPC_URL=https://rpc.citrea.xyz
REACT_APP_CITREA_TESTNET_RPC_URL=https://rpc.testnet.citrea.xyz
REACT_APP_CITREA_EXPLORER_URL=https://explorer.citrea.xyz
REACT_APP_DEFAULT_CHAIN_ID=62298
```

#### **5.3 Development Tooling**
- [ ] Configure Hardhat for Citrea deployment
- [ ] Set up local Citrea node testing
- [ ] Update deployment scripts for Citrea
- [ ] Configure subgraph for Citrea (if available)

---

### **PHASE 6: TESTING & QUALITY ASSURANCE**
*Duration: 3-4 days*

#### **6.1 Unit Test Updates**
- [ ] Update chain-specific tests
- [ ] Remove multi-chain test cases
- [ ] Add Citrea-specific test scenarios
- [ ] Test contract interaction with Citrea

#### **6.2 Integration Testing**
- [ ] Test wallet connection to Citrea
- [ ] Test token swapping on Citrea testnet
- [ ] Test liquidity provision (if pools exist)
- [ ] Test transaction signing and confirmation

#### **6.3 E2E Testing**
Update: `apps/web/src/pages/Swap/Swap.e2e.test.ts`
- [ ] Replace Ethereum test scenarios with Citrea
- [ ] Test full swap flow on Citrea testnet
- [ ] Test error handling for unsupported networks

#### **6.4 Performance Testing**
- [ ] Verify bundle size reduction
- [ ] Test loading times with single chain
- [ ] Verify RPC performance on Citrea

---

## 🚧 **CRITICAL DEPENDENCIES & BLOCKERS**

### **🚨 MUST-HAVE BEFORE STARTING:**

#### **1. Citrea Protocol Deployments**
```
❗ REQUIRED: Uniswap V2/V3 contracts deployed on Citrea
❗ REQUIRED: Contract addresses for all core protocols  
❗ REQUIRED: Initial liquidity pools with reasonable TVL
❗ REQUIRED: Stable RPC endpoints with good uptime
```

#### **2. Token Ecosystem**
```
❗ REQUIRED: Native CBTC bridge working
❗ REQUIRED: Popular tokens bridged to Citrea
❗ REQUIRED: Token list with accurate metadata
❗ REQUIRED: Price feeds for Citrea tokens
```

#### **3. Infrastructure**
```
❗ REQUIRED: Citrea subgraph for pool data
❗ REQUIRED: Block explorer API access
❗ REQUIRED: Wallet support (MetaMask, WalletConnect)
❗ REQUIRED: Faucet for testnet development
```

---

## 📋 **IMPLEMENTATION CHECKLIST**

### **Pre-Migration Preparation:**
- [ ] **Verify Citrea mainnet is stable and production-ready**
- [ ] **Confirm Uniswap protocol contracts are deployed**
- [ ] **Set up Citrea testnet development environment**
- [ ] **Create backup branch of current multi-chain code**

### **Migration Execution:**
- [ ] **Phase 1:** Dependencies cleanup
- [ ] **Phase 2:** Chain configuration  
- [ ] **Phase 3:** Protocol contracts
- [ ] **Phase 4:** UI modifications
- [ ] **Phase 5:** Development tooling
- [ ] **Phase 6:** Testing & QA

### **Post-Migration:**
- [ ] **Production deployment to Citrea mainnet**
- [ ] **Performance monitoring setup**
- [ ] **User feedback collection**
- [ ] **Documentation updates**

---

## ⚠️ **RISKS & MITIGATION**

### **HIGH RISK:**
1. **Citrea Protocol Immaturity**
   - *Risk:* Bugs, instability, poor performance
   - *Mitigation:* Extensive testnet testing, gradual rollout

2. **Limited Token Ecosystem** 
   - *Risk:* Few tokens, low liquidity
   - *Mitigation:* Coordinate with Citrea team on token bridges

3. **Development Complexity**
   - *Risk:* Breaking core functionality
   - *Mitigation:* Comprehensive testing, staged deployment

### **MEDIUM RISK:**
1. **Wallet Support Issues**
2. **RPC Reliability Problems** 
3. **User Adoption Challenges**

---

## 🎯 **SUCCESS METRICS**

### **Technical Metrics:**
- [ ] **Bundle size reduction:** 20-30%
- [ ] **Loading time improvement:** 15-25%
- [ ] **RPC response time:** <500ms average
- [ ] **Transaction success rate:** >95%

### **User Experience Metrics:**
- [ ] **Wallet connection success:** >90%
- [ ] **Swap completion rate:** >85%
- [ ] **User error rate:** <5%

### **Business Metrics:**
- [ ] **Active users migrated:** >50% within 30 days
- [ ] **Daily transaction volume:** Maintain current levels
- [ ] **User retention:** >80% month-over-month

---

## 📞 **NEXT STEPS**

1. **Immediate Actions:**
   - [ ] Verify Citrea protocol contract deployments
   - [ ] Set up Citrea testnet development environment
   - [ ] Create detailed technical specification document

2. **Team Coordination:**
   - [ ] Assign developers to each phase
   - [ ] Set up daily standups for migration progress
   - [ ] Coordinate with Citrea team for support

3. **Go/No-Go Decision:**
   - [ ] Evaluate Citrea ecosystem readiness
   - [ ] Confirm all critical dependencies are met
   - [ ] Get stakeholder approval for migration timeline

---

**📅 Total Estimated Timeline: 18-22 working days**

**👥 Recommended Team Size: 2-3 senior developers + 1 QA engineer**

**💰 Estimated Effort: 300-400 developer hours**

---

*This roadmap should be reviewed and approved by all stakeholders before beginning the migration process.*