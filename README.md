# Token Pricer

- Demo to get onchain data such as pair pricing, supported network, pool liquidity, optimizing routes for pricing etc.

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

# generate typechain-types

```
// typechain-types already in this repository, if you don't have it, please do :
npm run build:contract
```

### 2. Create Environment Variables

Create an environment file named .env and fill the next environment variables:

```
// ALCHEMY has less supported networks, considering only use Infura
// ALCHEMY_API_KEY=YOUR_ALCHEMY_API_KEY

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
[ETH-USD]: 3425.53600515
```

**Note: you can fetch the price of any pair of tokens by cross-feed computation.**

e.g.) ChainLink does not support CRV / CVX pair feed. However, they support CRV / ETH and CVX / ETH feeds. Therefore, we can compute the price of CRV in terms of CVX by crossing CRV / ETH and CVX / ETH feeds.

```bash
# [CRV-CVX]: 1) CRV-ETH -> 2) CVX-ETH
npx hardhat get-latest-answer --base crv --quote cvx --network mainnet

# response
!intersectedTicker is :  true
if(!intersectedTicker && baseFeedTicker === quoteFeedQuoteTicker) => intersectedTicker = quoteFeedQuoteTicker
intersectedTicker is : ETH
!intersectedTicker is :  false
!intersectedTicker is :  false
!intersectedTicker is :  false

[CRV-CVX]: 0.173562158107371488

# [LDO-MATIC]: 1) LDO-ETH -> 2) ETH-USD -> 3) MATIC-USD
npx hardhat get-latest-answer --base ldo --quote matic --network mainnet

# response
!intersectedTicker is :  true

[LDO-MATIC]: 2.984199148446889517
```

#### `Aggregator data`

```bash
# retrieves aggregator pair pool address : 1inch/ETH
npx hardhat get-aggregator --base 0x111111111117dC0aa78b770fA6A738034120C302 --quote eth --network mainnet

# response
0x111111111117dC0aa78b770fA6A738034120C302/eth on chainlink aggregator address is : 0xb2F68c82479928669B0487D1dAeD6Ef47b63411e

```

#### `Feed data`

```bash
# retrieves the ChainLink feed data
npx hardhat get-feed --base eth --quote usd --network mainnet

# response
{
  name: 'ETH / USD',
  category: 'low',
  path: 'eth-usd',
  base: 'ETH',
  quote: 'USD',
  decimals: 8,
  contractAddress: '0xE62B71cf983019BFf55bC83B48601ce8419650CC',
  proxyAddress: '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419'
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
[USDC-WETH]: 0.000291259601831955
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
  liquidity: '86634464471089737839',
  sqrtRatioX96: '4579235775264633044195490828',
  tick: -57019
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
  liquidity: '889855394836167405777374',
  sqrtRatioX96: '4575326363046473793417326085',
  tick: -57036
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
[WETH-USDC]: 3439.552343
```

#### `Uniswap V2 Pair State`

```bash
# retrieves the current state of a pair
npx hardhat get-pair-price --base weth --quote usdc --protocol sushi-swap --network mainnet

# response
[WETH-USDC]: 3435.012312
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
  liquidity: '3535961514086450',
  reserve0: '9919957979',
  reserve1: '2010854909269322779694',
  blockTimestampLast: '1712539739'
}
```

### `/contracts`

=> compile => typechain-types

### `/scripts`

=> yarn hardhat run scripts/... => generate schema -> tokens and feeds

### `/src`

- #### `config` => setup hardhat.config

- #### `constants` => hardcode addresses and data

- #### `schema` => after schema being generated,export functions like getTokens getFeeds etc

- #### `services` => excute tasks (main functionality in differet portocols)

- #### `types` => define global types

- #### `utils` => helper functions

- #### `tasks` => create tasks on hardhat to be excuted in terminal
