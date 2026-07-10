<div align="center">

# 🌌 Equinox AMM

**A constant-product AMM on Stellar Soroban — swap, provide liquidity, and watch live on-chain events.**

[![CI/CD](https://github.com/vidit-rise/equinox/actions/workflows/ci.yml/badge.svg)](https://github.com/vidit-rise/equinox/actions/workflows/ci.yml)
[![Stellar](https://img.shields.io/badge/Network-Stellar_Testnet-blue?logo=stellar)](https://stellar.org)
[![Soroban](https://img.shields.io/badge/Smart_Contracts-Soroban-purple?logo=rust)](https://soroban.stellar.org)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js_14-black?logo=next.js)](https://nextjs.org)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

**Live Demo:** [equinox.vidit1241-af4.workers.dev](https://equinox.vidit1241-af4.workers.dev/)
**Demo Video (1–2 min):** [Watch Walkthrough](https://github.com/vidit-rise/equinox/raw/main/screenshots/walkthrough_demo.mov)

</div>

---

## 📝 Project Description

Equinox AMM is a decentralized automated market maker (AMM) built on **Stellar** using **Soroban smart contracts**. Users connect a Freighter wallet, add a trustline for the Stellar Swap Token (referred to on-chain as **SST**), provide SST + XLM liquidity, swap between the two assets, and watch swap/liquidity events stream into the UI in near real-time. Three contracts cooperate on-chain — the **SST** token (Stellar Asset Contract), a liquidity pool, and a bridge that batches a pool swap with a fee transfer — demonstrating genuine **inter-contract communication**.

> This is a fresh, independent deployment: brand-new issuer/distributor keypairs, a new **SST** asset, and freshly deployed pool + bridge contracts — no shared or inherited addresses. Every address and tx hash below is real and verifiable on Stellar Expert. See [`deployments/testnet.json`](deployments/testnet.json).

---

## 🏛️ Architecture

```mermaid
graph TD
    User((User)) -->|Connect / Sign| Freighter[Freighter Wallet]
    Freighter -->|Signed TX| RPC[Soroban RPC]

    subgraph "Soroban Smart Contracts (Testnet)"
        Pool[Liquidity Pool]
        Token[SST Token - SAC]
        Bridge[Bridge]
    end

    RPC --> Pool
    Pool -->|env.invoke_contract: transfer| Token
    Bridge -->|env.invoke_contract: swap| Pool
    Bridge -->|env.invoke_contract: transfer| Token

    subgraph "Frontend (Next.js 14 — App Router)"
        UI[App Router pages]
        Reads[core/lib/stellarClientReads: client-side reads]
    end

    UI -->|SWR polling| Reads
    Reads -->|getEvents / simulate get_reserves| RPC
    Reads -->|account balances| Horizon[Horizon REST]
```

---

## 🧰 Tech Stack

- **Contracts:** Rust, Soroban SDK v21
- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind-free Plain CSS with a sleek, minimalist fintech design system
- **Data/polling:** SWR (2–5s refresh)
- **Wallet:** Freighter (`@stellar/freighter-api`)
- **SDK:** `@stellar/stellar-sdk`
- **Tests:** `cargo test` (contracts), Vitest (frontend)
- **CI/CD:** GitHub Actions
- **Network:** Stellar Testnet (Friendbot-funded)

---

## 📜 Smart Contracts (Testnet)

| Contract | Address | Stellar Expert |
| :--- | :--- | :--- |
| **SST Token** (Stellar Asset Contract) | `CCELLZIVJGLIGBPSPW225663T5FPMMZOMYQV62M5XC6R7PAMQF2NP2T2` | [view](https://stellar.expert/explorer/testnet/contract/CCELLZIVJGLIGBPSPW225663T5FPMMZOMYQV62M5XC6R7PAMQF2NP2T2) |
| **Liquidity Pool** | `CAWL62KWM4PYN25BMG7UGZTNGZUO4J7Z4H27DJICRR56CEJEVG5FY2CG` | [view](https://stellar.expert/explorer/testnet/contract/CAWL62KWM4PYN25BMG7UGZTNGZUO4J7Z4H27DJICRR56CEJEVG5FY2CG) |
| **Bridge** | `CCAFRHHLYRUKGKKEZMGGTNGH33QPZKIINLHAHA7U2TEB7WM5Z4VSLIFG` | [view](https://stellar.expert/explorer/testnet/contract/CCAFRHHLYRUKGKKEZMGGTNGH33QPZKIINLHAHA7U2TEB7WM5Z4VSLIFG) |

Issuer / deployer: [`GAEWKVJA…LZCB`](https://stellar.expert/explorer/testnet/account/GAEWKVJAQ4IJHS3D3QJZZFJ2EUB6PWLIX4PZRPKHERJJ5KGQU3R7LZCB) · SST asset: `SST:GAEWKVJA…LZCB`

---

## 🔗 Inter-Contract Calls

Equinox AMM uses real Soroban cross-contract invocation via `env.invoke_contract`:

- **Pool → Token:** [`add_liquidity` / `swap` / `remove_liquidity`](contracts/equinox-pool/src/lib.rs) all call the token contract's `transfer` function to move SST and XLM in/out of the pool.
- **Bridge → Pool → Token:** [`batch_operation`](contracts/equinox-bridge/src/lib.rs) calls `pool.swap(...)` (which itself invokes the token) and then `token.transfer(...)` (a 5% service fee) in a single transaction — a nested inter-contract call.

**On-chain proof (real, verifiable).** The `add_liquidity` tx sub-invoked `token.transfer` **twice** (SST + native XLM) in one transaction; the `batch_operation` tx nests bridge → pool → token:

| What | Transaction |
| :--- | :--- |
| `add_liquidity` → 2× `transfer` (100,000 SST + 4,000 XLM) | [`d99a6391…649e`](https://stellar.expert/explorer/testnet/tx/d99a639173ab00914648ac78218a680b73c7777611af5df07d860d07d5e4649e) |
| `swap` → `transfer` in + out | [`76f8ba23…b7e8`](https://stellar.expert/explorer/testnet/tx/76f8ba23617b21babe0bb1e095572c3c717914b779fc3276db8d7d0b304cb7e8) |
| `batch_operation` (bridge → pool → token, nested) | [`98e2d682…88e0`](https://stellar.expert/explorer/testnet/tx/98e2d6829c6a9049e71c33c4dbe78f936b5019d075c2069b6dee4ed979fc88e0) |
| Pool `initialize` | [`b3cf9bb0…6d45`](https://stellar.expert/explorer/testnet/tx/b3cf9bb0ae42608193f789949f1a777472b161130a1b8754e66b933f1d246d45) |
| Bridge `initialize` | [`ee3ef0fb…527d`](https://stellar.expert/explorer/testnet/tx/ee3ef0fbcd7f118cb88f7fd1ff7fa1abb294374a6cebf0ab86e477235175527d) |
| SST trustline + issuance | [`185d7fa6…9007`](https://stellar.expert/explorer/testnet/tx/185d7fa684773ca148621599fdccc952952831438d07089d76be171b00fc9007) |

> Open the `add_liquidity` tx on Stellar Expert and expand the operation to see the two sub-transfers (100,000 SST and 4,000 XLM) routed through the token contract — that is the inter-contract call executing.

---

## 👛 Wallet Connection

- Connect / disconnect via Freighter ([`useFreighterWallet`](frontend/core/hooks/useFreighterWallet.ts)).
- Session is silently restored if the site is already trusted; an explicit disconnect is remembered in `localStorage`.
- Network is auto-detected (Testnet vs Public) from the wallet.

---

## ⚙️ Core Mechanics

**Constant-product AMM** (`x · y = k`), implemented in [`equinox-pool`](contracts/equinox-pool/src/lib.rs):

```
amount_out = reserve_out − (reserve_in · reserve_out) / (reserve_in + amount_in)
```

- **Liquidity:** first deposit mints LP shares equal to the token amount; later deposits mint proportionally to reserves.
- **Deployed token:** the live SST token is a standard **Stellar Asset Contract (SAC)** — no transfer fee. The repo also ships a *custom* token contract ([`equinox-token`](contracts/equinox-token/src/lib.rs)) implementing a **1% transfer fee** with full tests, which can be deployed in place of the SAC if a fee-on-transfer token is desired.
- **Bridge service fee:** [`batch_operation`](contracts/equinox-bridge/src/lib.rs) takes a **5%** service fee via a second `token.transfer` (verified on-chain).
- **Known limitation:** the *pool* `swap` charges **no separate swap fee** and rounds the quotient down, so the pool's `k` is not strictly increasing on a swap. This is documented and covered by a frontend test (`__tests__/amm.test.ts`). Adding an explicit pool fee + `min_amount_out` slippage guard is a recommended follow-up.

The same constant-product math is mirrored client-side in [`core/lib/ammPricing.ts`](frontend/core/lib/ammPricing.ts) so UI quotes match the contract.

---

## 🚨 Error Handling

The swap flow ([`app/swap/page.tsx`](frontend/app/swap/page.tsx)) surfaces four distinct, user-facing states:

1. **Wallet not connected / not installed** → opens the Freighter connect flow (or “not installed” message).
2. **Invalid amount** → “Enter an amount to swap”.
3. **Insufficient balance** → “Insufficient {TOKEN} balance” (checked before building a tx).
4. **User-rejected signature** → “Transaction rejected in wallet”.

Plus: loading/pending spinners during submission, trustline status and action checks ([`useStellarTrustline`](frontend/core/hooks/useStellarTrustline.ts)), and normalized error extraction ([`safeStellarHandler`](frontend/core/lib/safeStellarHandler.ts)).
---

## 📸 Screenshots

### 🔗 Desktop Homepage
![Desktop Homepage](screenshots/desktop_homepage.png)

### 🔗 Mobile — Dashboard • Swap • Liquidity Pool
![Dashboard Mobile](screenshots/mobile_dashboard.png)
![Swap Mobile](screenshots/mobile_swap.png)
![Pool Mobile](screenshots/mobile_pool.png)

### 🔗 Walkthrough Demo
![Walkthrough Demo](screenshots/walkthrough_demo.gif)
### 🔗 CI/CD Pipeline (passing)
![CI Passing](screenshots/ci_passing.png)

---
## 🚦 Setup Instructions

### Prerequisites
- [Rust & Cargo](https://rustup.rs/) + `wasm32-unknown-unknown` target
- [Stellar CLI](https://developers.stellar.org/docs/tools/stellar-cli/install)
- [Node.js 20+](https://nodejs.org/)
- [Freighter Wallet](https://www.freighter.app/)

### 1. Build & test contracts
```bash
make build-contracts
# Contract unit tests are run using the standard toolchain:
cargo test --manifest-path contracts/Cargo.toml
```

### 2. Frontend
```bash
cd frontend
npm install
cp .env.example .env.local   # contract addresses are pre-filled for the existing testnet deployment
npm run dev
```

### 3. (Optional) Deploy your own contracts
Requires funded testnet keys:
```bash
STELLAR_ISSUER_SECRET=S... STELLAR_DISTRIBUTOR_SECRET=S... node scripts/deploy.js
```
The script funds accounts via Friendbot, deploys the SAC + pool + bridge, initializes them, and writes real addresses/tx hashes to `deployments/testnet.json`.

### 4. Deploy the frontend to Cloudflare Pages
The frontend is a **fully static export** (no server runtime — all chain reads happen client-side against public RPC/Horizon), so it deploys as static assets.

```bash
cd frontend
npm run build      # output: 'export' → produces frontend/out/
```

**Cloudflare Pages settings** (Dashboard → Workers & Pages → Create → Pages → Connect to Git):

| Setting | Value |
| :--- | :--- |
| Production branch | `main` |
| Framework preset | `Next.js (Static HTML Export)` |
| Build command | `cd frontend && npm install && npm run build` |
| Build output directory | `frontend/out` |

The contract addresses are baked into [`core/lib/networkConfig.ts`](frontend/core/lib/networkConfig.ts) as defaults, so it works with no env config. To override, add `NEXT_PUBLIC_POOL_CONTRACT_ADDRESS`, `NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS`, `NEXT_PUBLIC_SST_ISSUER`, `NEXT_PUBLIC_SOROBAN_RPC_URL`, and `NEXT_PUBLIC_HORIZON_URL` in the Pages **Environment variables** (Production) before building.

---

## 🧪 Testing

**Contracts** — 17 passing tests:
```
equinox-pool   : 6 passed  (add/remove liquidity, swap output, get_price, swap event, inter-contract call)
equinox-token  : 8 passed  (mint, burn, transfer fee, auth, events, ...)
equinox-bridge : 3 passed  (batch_operation, get_contracts, zero-amount panic)
```

**Frontend** — Vitest (`cd frontend && npm test`): 7 passing tests for the AMM quote math in `core/lib/ammPricing.ts`, including a case asserted against the on-chain `test_swap_output` result (in=100 → out=91).

Both run in CI on every push (`.github/workflows/ci.yml`).

---

## ⚖️ License

Distributed under the MIT License.

<div align="center"><br/>Built on Stellar 🌌</div>
