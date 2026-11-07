# TON-Coin

An early-stage, non-custodial TON dApp foundation. The connected wallet is used
only when the user explicitly requests and approves a TON transfer. The app does
not hold private keys or provide background signing.

**Not production-ready:** the Jetton contracts are an unaudited Acton starter.
The experimental STON.fi integration is disabled by default and has not been
validated against a live DEX. Staking, mining, automated agent execution, and
on-chain verification are not implemented. Do not send funds to an unknown
contract or interpret this repository as an audited financial product.

## Run the app

Requires Node.js 22+ and npm. The TON Connect manifest must identify the actual
public HTTPS URL of the deployed app. For local development the default is
`http://localhost:5173`.

```sh
npm ci
npm run dev
# Production build: use the exact public origin, without a trailing slash.
VITE_APP_URL=https://your-domain.example npm run build
npm test
```

Open the configured URL, connect a wallet, and select the wallet's network in
the transfer form. A wallet confirmation is required for every transfer. The
wallet's returned message is not proof of on-chain completion; inspect the
transaction in a block explorer. TON Connect handles connection restoration and
mobile wallet handoff. Wallet availability depends on the wallet and device;
WalletConnect is a separate protocol and is not implemented here.

An experimental, mainnet-only TON-to-Jetton swap interface can be explicitly
enabled at build time with `VITE_ENABLE_EXPERIMENTAL_SWAPS=true`. It uses
STON.fi's public API and router SDK and Toncenter RPC, not a local AMM.
It requires those services to be reachable from the browser, trusts their
responses, and has not been tested end-to-end against the live network.
Before enabling it for real funds, independently verify quotes, router
addresses, transactions, refunds, and token authenticity. Quotes expire after
30 seconds; each swap requires wallet approval. A submitted message is not
proof that all asynchronous swap transactions succeeded.

Mobile wallets must be able to fetch the manifest and icon themselves.
`localhost` on a phone does not point to your development machine; use a
public HTTPS origin for mobile testing and set `VITE_APP_URL` accordingly.

The developer address `UQDk-1Gqc4YIC22LTAAZLxomhkyp-V52B0yaeHgmk3t9Lli6`
is displayed for reference only. It does not prove ownership, authorize a
connected wallet, or configure an agentic wallet.

## Agentic wallets

TON Connect does not grant unattended signing. Agentic wallets use a separate
operator key and require explicit owner onboarding, funding, and on-chain
authorization. The official MCP server can be used separately:

```sh
npx skills add ton-connect/kit/packages/mcp
NETWORK=testnet npx @ton/mcp@0.1.15-alpha.23
```

See the [official MCP documentation](https://github.com/ton-connect/kit/tree/main/packages/mcp)
and [Agentic Wallets](https://agents.ton.org/). Select and validate the intended
wallet and network explicitly, emulate before broadcasting, and check the full
transaction trace afterward. `examples/ton-mcp.json` is a testnet stdio MCP
configuration for clients using the `mcpServers` JSON format; review the
client's documentation before adding it. It is not loaded automatically and
does not bind the agent to the developer address. Use the MCP
`agentic_validate_wallet` tool with the intended agent wallet, network, and
owner address, and complete owner authorization before granting an operator
key. Displaying an address is not proof of control. MCP registry secrets are stored in a locally
obfuscated file, not encrypted with an external secret; secure the host and never commit keys or mnemonics. The skills installer downloads external
code; review its source and pin an appropriate version before use.

## Acton workspace

The Jetton contracts, native Tolk tests, wrappers, and management scripts were
generated from the Acton 1.2.1 `jetton` template. The minter starts with zero
supply; its admin can mint, change metadata, and upgrade the contract. These
are powerful privileges, not a fixed-supply policy. No deployment is included
or verified on-chain. The supplied developer address is not automatically
assigned as admin: specify an address you control and verify it before any
deployment.

Install the verified v1.2.1 release for your platform from
the [official release](https://github.com/ton-blockchain/acton/releases/tag/v1.2.1),
check its published SHA-256 checksum, and run `acton init --stdlib-only` after
checkout. Then:

```sh
acton build
acton fmt --check
acton check
acton test --fuzz-seed 42 --coverage --coverage-format lcov
acton test tests/gas.test.tolk --baseline-snapshot benchmarks/jetton-gas.json --fail-on-diff
acton wrapper --all --ts
acton test --ui
```

Generated TypeScript wrappers are in `wrappers-ts/`; regenerate them after
changing contracts. `acton test --ui` provides decoded traces where an ABI is
available. Use `acton test --debug` and the official TON IDE extension for
debugging; Acton's language server is `acton ls`. See `acton test --help` for
fuzz seeds, mutation testing, fork options, and gas snapshots. The native fuzz
test checks transfer balance conservation over 64 inputs. CI compares the
focused gas suite with the checked-in Acton 1.2.1 baseline; deliberate gas
changes require reviewing and regenerating that baseline with
`acton test tests/gas.test.tolk --snapshot benchmarks/jetton-gas.json`. No live
fork scenarios are configured. The Contracts workflow also offers a manually
triggered critical mutation run with a 70% minimum. The most recent local run
killed 16 of 21 compilable mutants; five survived and two did not compile.
Mutation includes imported sources, so survivors must be reviewed in context;
this is not evidence that the contracts are secure.

VS Code and Cursor can use the recommended TON extension and the provided
tasks for the test UI and full backtraces. For JetBrains, install the TON
plugin and open this directory as an Acton project. Zed users can run `acton
ls` through a compatible Tolk language-server extension; no Zed debugger is
configured. Features vary by editor and extension version.

The scripts create on-chain metadata by default and support deployment and
administration. For off-chain TEP-64 metadata, publish a JSON document such as
`metadata/ton-coin.json` at a public HTTPS URL and set `JETTON_METADATA_URI`
to that URL before deployment or a metadata update. Hosting and integrity of
that document are the operator's responsibility.
For local emulation run `acton run deploy-emulation`. To experiment on testnet,
create and fund a testnet wallet (`acton wallet new --name deployer --local
--airdrop`) and run `acton run deploy-testnet`. Set metadata and
`JETTON_ADMIN_ADDRESS` explicitly as needed; see `scripts/utils/common.tolk`.
Never put wallet keys or `.env` files in source control. Mainnet deployment is
not configured as an automated job; obtain an independent audit and specify
token policy before considering it.

On TON, contracts execute when messages arrive; block history alone cannot
trigger autonomous reward distribution. Staking needs a funded reward model
and a defined trigger or permissionless keeper. Before implementing financial
contracts, specify token supply, admin rights, fees, staking rewards, mining
rules, oracle/routing assumptions, and failure recovery, then obtain independent
security review.

The repository is `RFOF-NETWORK/TON-Coin`; the requested owner
`RFDF-NETWORK` is not the current repository owner.
