# Credit to : https://github.com/neocortex404/token-pricer

# Token Pricer

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

# generate typechain-types

```
npm run build:contract
```

### 2. Create Environment Variables

Create an environment file named .env and fill the next environment variables:

```
ALCHEMY_API_KEY=YOUR_ALCHEMY_API_KEY
INFURA_API_KEY=YOUR_INFURA_API_KEY
```

This package supports the following networks:

- Ethereum
- Optimism
- BSC
- Polygon
- Arbitrum One
- Avalanche

**NOTE: Alchemy API does not support BSC and Avalanche chains. Please provide Infura API Key to use this package on BSC and Avalanche.**

### 3. Generate Schema

Once dependencies are installed and the environment variables are set, you will need to generate the ChainLink feed list and token list. To do this, run:

- generate ChainLink feed list

```bash
npm run generate:feed
```

- generate token list

```bash
npm run generate:token
```

You will be able to find these schema on src/schema

## Usage (via Hardhat tasks)

### ChainLink Aggregators

#### `Supported Networks`

```bash
# retrieves the list of supported networks
npx hardhat chainlink-supported-networks

# response
[
  { id: 1, network: 'MAINNET' },
  { id: 10, network: 'OPTIMISM' },
  { id: 56, network: 'BSC' },
  { id: 137, network: 'POLYGON' },
  { id: 42161, network: 'ARBITRUM' },
  { id: 43114, network: 'AVALANCHE' }
]
```

#### `Token price`

```bash
# retrieves the latest answer from ChainLink feed
npx hardhat get-latest-answer --base eth --quote usd --network mainnet

# response
[ETH-USD]: 1855.22538476
```

**Note: you can fetch the price of any pair of tokens by cross-feed computation.**

e.g.) ChainLink does not support CRV / CVX pair feed. However, they support CRV / ETH and CVX / ETH feeds. Therefore, we can compute the price of CRV in terms of CVX by crossing CRV / ETH and CVX / ETH feeds.

```bash
# [CRV-CVX]: 1) CRV-ETH -> 2) CVX-ETH
npx hardhat get-latest-answer --base crv --quote cvx --network mainnet

# response
[CRV-CVX]: 0.200327762924928613

# [LDO-MATIC]: 1) LDO-ETH -> 2) ETH-USD -> 3) MATIC-USD
npx hardhat get-latest-answer --base ldo --quote matic --network mainnet

# response
[LDO-MATIC]: 2.174147984041051148
```

#### `Feed data`

```bash
# retrieves the ChainLink feed data
npx hardhat get-feed --base eth --quote usd --network mainnet

# response
{
  name: 'BTC / ETH',
  category: 'verified',
  path: 'btc-eth',
  base: 'BTC',
  quote: 'ETH',
  decimals: 18,
  contractAddress: '0x81076d6Ff2620Ea9Dd7bA9c1015f0d09A3A732E6',
  proxyAddress: '0xdeb288F737066589598e9214E782fa5A8eD689e8'
}
```

### Uniswap V3 Pools

#### `Supported Networks`

```bash
# retrieves the list of supported networks
npx hardhat v3-supported-networks

# response
[
  { id: 1, network: 'MAINNET' },
  { id: 10, network: 'OPTIMISM' },
  { id: 56, network: 'BSC' },
  { id: 137, network: 'POLYGON' },
  { id: 42161, network: 'ARBITRUM' }
]
```

#### `Token Price`

```bash
# retrieves the current price of USDC in terms of WETH from WETH-USDC/3000 pool
npx hardhat get-pool-price --base usdc --quote weth --fee 3000 --network mainnet

# response
[USDC-WETH]: 0.000539414428252094

# retrieves the time-weighted average price (12 hours) of USDC in terms of WETH from WETH-USDC/3000 pool
npx hardhat get-pool-price --base usdc --quote weth --fee 3000 --period 43200 --network mainnet

# response
[USDC-WETH]: 0.000536509585712507
```

#### `Uniswap V3 Pool State`

```bash
# retrieves the current state of a pool
npx hardhat get-pool-state --base uni --quote weth --fee 500 --network mainnet

# response
{
  pool: '0xfaA318479b7755b2dBfDD34dC306cb28B420Ad12',
  token0: {
    chainId: 1,
    address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    name: 'Uniswap',
    symbol: 'UNI',
    decimals: 18
  },
  token1: {
    chainId: 1,
    address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    name: 'Wrapped Ether',
    symbol: 'WETH',
    decimals: 18
  },
  fee: 500,
  liquidity: '33587975974682609622',
  sqrtRatioX96: '4474214193862182965005460616',
  tick: -57483
}
```

#### `Uniswap V3 Pool with Most Liquidity`

```bash
# finds the pool with most liquidity and returns the current state
npx hardhat get-most-liquidity-pool --base uni --quote weth --network mainnet

# response
{
  pool: '0x1d42064Fc4Beb5F8aAF85F4617AE8b3b5B8Bd801',
  token0: {
    chainId: 1,
    address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    name: 'Uniswap',
    symbol: 'UNI',
    decimals: 18
  },
  token1: {
    chainId: 1,
    address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    name: 'Wrapped Ether',
    symbol: 'WETH',
    decimals: 18
  },
  fee: 3000,
  liquidity: '379400490401418060235134',
  sqrtRatioX96: '4479990985087598784643984557',
  tick: -57458
}
```

### Uniswap V2 Pairs

This package supports the following protocols by default:

- Uniswap V2 (Ethereum)
- Sushi-Swap (Ethereum, BSC, Polygon, Arbitrum One, Avalanche)
- Pancake-Swap (BSC)
- Quick-Swap (Polygon)
- Trader-Joe (Avalanche)
- Pangolin (Avalanche)

#### `Supported Networks`

```bash
# retrieves the list of supported networks
npx hardhat v2-supported-networks

# response
[
  { id: 1, network: 'MAINNET' },
  { id: 56, network: 'BSC' },
  { id: 137, network: 'POLYGON' },
  { id: 42161, network: 'ARBITRUM' }
  { id: 42161, network: 'AVALANCHE' }
]
```

#### `Supported Protocols`

```bash
# retrieves the list of supported protocols on network
npx hardhat v2-supported-protocols --network avalanche

# response
[ 'trade-joe', 'pangolin', 'sushi-swap' ]
```

#### `Token Price`

```bash
# retrieves the current price of WETH in terms of USDC from WETH-USDC pair
npx hardhat get-pair-price --base weth --quote usdc --protocol uniswap --network mainnet

# response
[WETH-USDC]: 1853.725093
```

#### `Uniswap V2 Pair State`

```bash
# retrieves the current state of a pair
npx hardhat get-pair-price --base weth --quote usdc --protocol sushi-swap --network mainnet

# response
{
  protocol: 'sushi-swap',
  pair: '0xCEfF51756c56CeFFCA006cD410B03FFC46dd3a58',
  token0: {
    chainId: 1,
    address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    name: 'Wrapped BTC',
    symbol: 'WBTC',
    decimals: 8
  },
  token1: {
    chainId: 1,
    address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    name: 'Wrapped Ether',
    symbol: 'WETH',
    decimals: 18
  },
  liquidity: '601595043680888',
  reserve0: '39006114797',
  reserve1: '5867938714915205655376',
  blockTimestampLast: '1680979079'
}
```

#### `Uniswap V2 Pair with Most Liquidity`

```bash
# finds the pair with most liquidity and returns the current state
npx hardhat get-most-liquidity-pair --base wbtc --quote weth --network mainnet

# response
{
  protocol: 'uniswap',
  pair: '0xBb2b8038a1640196FbE3e38816F3e67Cba72D940',
  token0: {
    chainId: 1,
    address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    name: 'Wrapped BTC',
    symbol: 'WBTC',
    decimals: 8
  },
  token1: {
    chainId: 1,
    address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    name: 'Wrapped Ether',
    symbol: 'WETH',
    decimals: 18
  },
  liquidity: '5414749641400481',
  reserve0: '17328869456',
  reserve1: '2606397697702479337589',
  blockTimestampLast: '1680983327'
}
```

![testing drawio](./test.drawio.png)

- -contracts
  => compile => typechain-types

- -scripts
  => yarn hardhat run scripts/... => generate schema -> tokens and feeds

- -src
  - -config => setup hardhat.config
  - -constants => hardcode addresses and data
  - -schema => after schema being generated,export functions like getTokens getFeeds etc
  - -services => excute tasks (main functionality in differet portocols)
  - -types => define global types
  - -utils => helper functions
- -tasks => create tasks on hardhat to be excuted in terminal
