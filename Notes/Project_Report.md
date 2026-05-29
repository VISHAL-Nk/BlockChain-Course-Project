# PROJECT REPORT

## NFT-Based Secure Event Ticketing and Cryptographic Gate Verification Platform

**Course Project Report**  
**Subject:** Blockchain & Distributed Ledgers  
**Target Environment:** Linux (Arch Linux)  
**Development Stack:** Solidity, Hardhat, Ethers.js, HTML5-QRCode, Node.js (Express), IPFS/Pinata  

---

### Abstract
Digital ticketing systems face persistent vulnerabilities due to their reliance on copyable media (PDFs, screenshots) and centralized database backends. These flaws enable ticket duplication, resale price-gouging (scalping), and forgery. This project presents a decentralized application (dApp) that mitigates these security threats by minting every event ticket as a unique non-fungible token (NFT) under the ERC-721 standard on a local Ethereum network (Hardhat). 

Furthermore, to prevent the common flaw of "screenshot sharing," we design and implement a **Secure 3-Step Dual-Confirmation Gate Verification Protocol**. This protocol integrates on-chain verification with zero-gas cryptographic signatures, verifying that the physical holder at the entry gate controls the private key of the wallet holding the NFT ticket. The platform also regulates secondary markets, enforcing a contract-level 120% price cap on resales and automating a 10% royalty redistribution to event organizers.

---

## 1. Introduction

### 1.1 Problem Statement
Traditional ticketing systems are plagued by three primary vectors of fraud:
1. **Ticket Duplication:** A single digital ticket barcode or QR code can be screenshotted or copied. Multiple users can attempt to enter the venue with the same credentials, creating operational chaos and revenue loss.
2. **Ticket Counterfeiting / Forgery:** Malicious actors can generate replica tickets that visually mimic legitimate ones, bypass central validation checkups, and dupe buyers on secondary markets.
3. **Unregulated Resale (Scalping):** Automated bots sweep primary ticket supplies to resell them on secondary markets at exorbitant markups, extracting value from artists and fans alike.

### 1.2 Proposed Solution
By leveraging blockchain technology, we build an immutable registry where tickets are stored as ERC-721 NFTs. 
* **Immutable Registry:** Ticket ownership is audited by a decentralized network. A ticket cannot be duplicated; only one wallet address can own a token at a time.
* **On-Chain Resale Enforcement:** Resale is handled by the contract itself, capping maximum secondary prices and routing royalties to organizers.
* **Dual-Confirmation Verification:** Gates verify ticket validity not just by scanning a QR code, but by challenging the attendee to sign a cryptographic message using MetaMask. This proves private key ownership without requiring gas.

---

## 2. Technology Stack

The platform is designed around a decoupled, multi-layered architecture:

| Layer | Component | Description / Role |
| :--- | :--- | :--- |
| **Layer 1: Ledger** | Hardhat Local Node | Simulates the Ethereum blockchain. Provides an RPC gateway at `127.0.0.1:8545` (Chain ID `31337`). |
| **Layer 2: Storage** | IPFS (via Pinata Cloud) | Stores rich off-chain metadata (descriptions, dates, ticket images). Referenced on-chain via IPFS CID hashes. |
| **Layer 3: Logic** | Solidity Smart Contract | [TicketNFT.sol](file:///home/vishn/Documents/Project/BlockChain/Backend/contracts/TicketNFT.sol) contains the core business logic, minting rules, resale limits, and state variables. |
| **Layer 4: Server** | Node.js Express Server | Serves static frontend files and hosts helper endpoints (`/api/upload-to-ipfs` and `/api/generate-qr`). |
| **Layer 5: Client** | HTML5, CSS3, Ethers.js | Frontend interface. Connects to MetaMask to sign transactions and verify user identities. |

---

## 3. System Design and Architecture

```
                               ┌────────────────────────────────────────────────────────┐
                               │                    Express Web Server                  │
                               │                     (Port 3000)                        │
                               └──────────────────────────┬─────────────────────────────┘
                                                          │ Serves Static Files
                                                          ▼
┌──────────────┐                  ┌─────────────────────────────────────────────────────┐                  ┌─────────────┐
│              │  CIDs & Uploads  │                  Frontend UI                        │  Connect Wallet  │             │
│ Pinata / IPFS│ ◄───────────────►│  (Ethers.js v6, HTML5-QRCode, Vanilla JavaScript)   │ ◄───────────────►│  MetaMask   │
│              │                  │   Tabs: Browse, Dashboard, My Tickets, Verifier     │                  │  Extension  │
└──────────────┘                  └───────────────────────┬─────────────────────────────┘                  └──────┬──────┘
                                                          │                                                       │
                                                          │ Calls Functions & Triggers Tx                         │ Signs Tx
                                                          ▼                                                       ▼
                                  ┌─────────────────────────────────────────────────────────────────────────────────────┐
                                  │                            Hardhat Local Blockchain                                 │
                                  │                                (Chain ID 31337)                                     │
                                  │                      Deploys TicketNFT.sol Smart Contract                           │
                                  └─────────────────────────────────────────────────────────────────────────────────────┘
```

The system splits authority between three actors:
1. **Organizer (Contract Owner):** Deploys the contract, registers events, authorizes verifiers, and withdraws primary sale revenues.
2. **Buyer:** Purchases tickets directly from the organizer or buys them on the secondary marketplace, displays ticket QR codes, and signs ownership verification challenges.
3. **Verifier (Gate Staff):** Scans ticket QR codes, verifies the attendee's signature, and broadcasts the `markUsed` transaction to deactivate the ticket.

---

## 4. Smart Contract Design (`TicketNFT.sol`)

The core logic of the platform resides in `TicketNFT.sol`. It inherits from OpenZeppelin’s security-audited standards: `ERC721` (Non-Fungible Tokens), `Ownable` (Access Control), and `ReentrancyGuard` (Anti-reentrancy protection).

### 4.1 State Variables and Mappings
* `struct Event`: Stores data for an event, including `eventId`, `name`, `organizer`, `maxTickets`, `ticketsSold`, `priceWei`, `metadataCID`, and `isActive`.
* `events`: Mapping from `eventId => Event` containing registered event details.
* `usedTickets`: Mapping from `tokenId => bool` indicating if a ticket has been marked as used at the gate.
* `ticketEvent`: Mapping from `tokenId => eventId` mapping a ticket back to its parent event.
* `ticketResalePrice`: Mapping from `tokenId => priceWei` storing current secondary sale listings.
* `verifiers`: Private mapping from `address => bool` storing authorized gate verifiers.

### 4.2 Core Methods
* `createEvent(string name, uint256 maxTickets, uint256 priceWei, string metadataCID)`: Emits `EventCreated`. Restricted to the contract owner.
* `purchaseTicket(uint256 eventId)`: Handles ticket purchases. Reverts if the event is cancelled, sold out, or if the attached ETH payment matches incorrectly. Emits `TicketPurchased`.
* `markUsed(uint256 tokenId)`: Restricts entry to authorized gate verifiers. Sets the `usedTickets` mapping for the token to `true`. Emits `TicketUsed`.
* `listTicketForSale(uint256 tokenId, uint256 salePriceWei)`: Lists a ticket for resale. Enforces that the reseller is the actual owner and that `salePriceWei` does not exceed **120%** of the original purchase price.
* `buyResaleTicket(uint256 tokenId)`: Processes secondary sales. Transacts payment from secondary buyer to seller, automatically intercepts a **10% royalty** routed to the event organizer, clears the listing, and transfers the NFT token.
* `withdrawFunds()`: Transfers the contract's accumulated primary sales balance to the owner. Protected against reentrancy.

---

## 5. The Secure 3-Step Gate Verification Protocol

Standard QR codes are vulnerable to screenshots. To circumvent this, we designed a multi-step cryptographic handshake:

### 5.1 Verification Protocol Sequence

```
Attendee (Holder)                               Verifier (Gate)                            Blockchain
       │                                               │                                        │
       │───────── Presents Ticket QR Code ────────────►│                                        │
       │          (Encodes TokenID & Wallet Addr)      │                                        │
       │                                               │                                        │
       │                                               │─── Call isTicketValid(ID, Addr) ──────►│
       │                                               │◄── Returns True/False ─────────────────│
       │                                               │                                        │
       │◄──────── Prompts with Signature Challenge ────│                                        │
       │                                               │                                        │
       │─── Sign message via MetaMask (personal_sign) ─►│                                        │
       │    (Message: ID + Timestamp + Contract Addr)  │                                        │
       │                                               │                                        │
       │                                               │─── Cryptographic Verification ─────────│
       │                                               │    (ethers.verifyMessage == Addr)      │
       │                                               │                                        │
       │                                               │─── Send Tx: markUsed(TokenID) ────────►│
       │                                               │◄── Transaction Mined & Confirmed ──────│
       │                                               │                                        │
       ├───────────────── ENTRY GRANTED ───────────────┤                                        │
```

#### Step 1: On-Chain Registry Validation
* **Action:** The attendee displays a QR code containing a JSON payload with the `tokenId` and their public `walletAddress`.
* **Execution:** The verifier scans the code using the webcam component. The application calls `isTicketValid(tokenId, walletAddress)` on the smart contract.
* **Outcome:** The blockchain confirms:
  1. The wallet address is the current registered owner of the NFT.
  2. The ticket has not already been scanned (`usedTickets[tokenId] == false`).

#### Step 2: Off-Chain Cryptographic Signature Challenge (Impersonation Prevention)
* **Action:** To prove they actually own the wallet (preventing the use of a screenshotted QR code belonging to another user), the attendee connects their MetaMask wallet. The verifier pushes a signature challenge.
* **Execution:** The attendee signs a unique challenge string containing the `tokenId`, a fresh `timestamp` (to prevent replay attacks), and the `contractAddress`:
  `I am the owner of TicketNFT Token #X. Timestamp: Y. Contract: Z.`
  MetaMask triggers a `personal_sign` prompt. Since this is an off-chain cryptographic signature, it **costs zero gas** and does not require writing to the chain.
* **Validation:** The frontend application extracts the signer's address from the signature using ECDSA recovery (`ethers.verifyMessage`). If the recovered address matches the expected owner address scanned in Step 1, identity is verified.

#### Step 3: Ticket Consumption (Double-Entry Prevention)
* **Action:** Once identity is proven, the gate verifier clicks "Mark as Used".
* **Execution:** The verifier switches MetaMask to their authorized account. The application submits a transaction invoking `markUsed(tokenId)`.
* **Outcome:** The contract writes to state, permanently updating `usedTickets[tokenId] = true`. The transaction is mined, emitting the `TicketUsed` event. Any subsequent verification attempt for this token will immediately fail at **Step 1**.

---

## 6. Security Analysis and Threat Modeling

Our system provides robust defenses against common attack vectors:

* **Screenshot Replay Attack:** If a user screenshots a ticket and shares it, the scanner will read the genuine owner's address. However, at **Step 2**, the presenter will be challenged to sign a message using MetaMask. Because they do not possess the private key corresponding to the owner's address, they cannot produce a valid signature, and entry is rejected.
* **Double-Spending (Double Entry):** If the legitimate owner enters the venue, their ticket is immediately marked as used on-chain in **Step 3**. If they attempt to share the ticket or walk back to scan it again, Step 1 will return `false`, blocking entry.
* **Resale Price Gouging (Scalping):** Price limits are coded directly in the contract. A listing is rejected if `salePriceWei > originalPrice * 1.20`. Since buyers will only transact secondary purchases via `buyResaleTicket` to ensure they receive the actual NFT, they cannot be forced to pay inflated prices.
* **Royalty Bypass:** Royalties are enforced on-chain. When a ticket is resold, the `buyResaleTicket` function splits the incoming payment (`msg.value`), sending 10% to the organizer and 90% to the reseller. This makes royalty evasion impossible for transactions occurring on the platform.
* **Reentrancy Vulnerability:** Functions dealing with ether withdrawals (`withdrawFunds` and `buyResaleTicket`) utilize OpenZeppelin's `ReentrancyGuard` modifier (`nonReentrant`) and follow the checks-effects-interactions pattern to ensure malicious contracts cannot recursively drain funds.

---

## 7. Testing and Verification

To ensure the system's correctness, a suite of automated unit tests was created containing 9 distinct assertions:

1. **Event Creation Test:** Asserts that only the contract owner can register events, and that event parameters are stored correctly.
2. **Purchase Event Test:** Validates that buyers can purchase tickets by sending the correct amount of Ether, checking that the NFT is minted to the buyer's address and the `ticketsSold` counter increments.
3. **Invalid Purchase Test:** Verifies that transactions revert if an incorrect amount of Ether is sent or if an event is inactive/cancelled.
4. **Resale Limitation Test:** Validates that resale listings above the 120% price cap are rejected.
5. **Royalty Distribution Test:** Confirms that upon a resale transaction, 10% of the funds are transferred to the organizer's address and 90% to the reseller.
6. **Verifier Access Control Test:** Validates that only addresses set as verifiers by the organizer can invoke the `markUsed` function.
7. **Ticket Validation Query Test:** Ensures `isTicketValid` correctly evaluates the combination of owner address and used status.
8. **Consumption State Test:** Asserts that marking a ticket as used updates the used state permanently on-chain.
9. **Double-Spend Prevention Test:** Asserts that invoking `markUsed` a second time on the same token fails.

All tests compiled and completed successfully, establishing contract reliability.

---

## 8. Conclusion and Future Work

### 8.1 Summary
This project successfully demonstrates a secure, decentralised ticketing solution. By pairing ERC-721 NFTs with a dual-confirmation cryptographic protocol, we have eliminated the vulnerabilities of ticket counterfeiting, screenshot replication, and secondary market manipulation. The local Hardhat environment successfully simulates the ledger, while Express serves as a lightweight integration layer.

### 8.2 Future Enhancements
For production-grade deployment, the following areas will be explored:
1. **Gas Fee Optimization (Layer 2):** Deploying on Ethereum Mainnet is cost-prohibitive for average event tickets due to high gas costs. Migrating the contract to a Layer 2 Rollup network (e.g., Arbitrum, Optimism, or Polygon) will reduce transaction costs to fractions of a cent.
2. **Gasless Transactions (ERC-2771):** To improve user onboarding, gasless "meta-transactions" can be introduced. A relayer can submit the verifier's `markUsed` transactions, allowing organizers to sponsor the gas costs.
3. **Dynamic NFTs (ERC-1155):** For events with multiple ticket classes (VIP, General, Backstage), the ERC-1155 multi-token standard can be deployed to reduce smart contract deployment complexity and optimize state gas costs.
