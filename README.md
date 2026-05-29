# 🎫 TicketNFT: Secure NFT Event Ticketing & Verification Platform

A decentralized, end-to-end concert ticketing platform and secondary marketplace built on Ethereum. Tickets are minted as ERC-721 Non-Fungible Tokens (NFTs) to ensure transparency and security. 

To completely eliminate **screenshot and replication fraud**, the platform features a custom **Secure 3-Step Dual-Confirmation Gate Verification Protocol** combining webcam QR scanning, cryptographic message signing (zero-gas), and on-chain state changes.

---

## 🚀 Key Features

*   **Decentralized Primary Sales:** Organizers register events with ticket supply caps and prices. Attendees purchase tickets directly via MetaMask using Ether (ETH).
*   **Regulated Secondary Marketplace:** Built-in anti-scalping protections enforce a **maximum 120% resale price cap** on secondary listings.
*   **On-Chain Royalties:** Resale purchases automatically calculate and route **10% of the sale price as a royalty** back to the event organizer, with the remaining 90% sent to the reseller.
*   **Secure Gate Verification:** A webcam-based QR scanner reads ticket credentials, challenges the attendee to sign a free cryptographic message verifying private key ownership, and marks the ticket as used on-chain to prevent double-entry.
*   **Offline/Local Demo Mode:** The Node.js Express server automatically generates mock IPFS CIDs if Pinata API keys are missing, allowing complete offline execution and testing.

---

## 🏗 Project Architecture

The repository is organized into three distinct sub-projects:

```
BlockChain/
├── Backend/                   # Solidity Contracts & Hardhat environment
│   ├── contracts/
│   │   └── TicketNFT.sol      # ERC-721 Ticketing & Resale smart contract
│   ├── scripts/
│   │   └── deploy.js          # Deploys contract and exports ABI config
│   ├── hardhat.config.js      # Local network node settings (Chain ID 31337)
│   └── package.json
│
├── Frontend/                  # Vanilla Web Application
│   ├── index.html             # UI with Browse, Dashboard, My Tickets & Verifier views
│   ├── style.css              # Custom modern light-themed stylesheet
│   ├── app.js                 # Frontend Ethers.js integration & verification workflow
│   └── config.js              # AUTO-GENERATED: Active contract address & ABI
│
├── server/                    # Backend Node.js Express Server
│   ├── server.js              # Static file server, IPFS API & QR generator
│   └── package.json
│
└── Notes/                     # Documentation files
    ├── Blockchain_Newbie_Guide.md  # Plain-English guide for beginners
    └── Project_Report.md           # Formal project structure & analysis report
```

---

## ⚙️ Quick Start Guide

Follow these steps in order to start and run the application locally.

### Prerequisites
*   [Node.js](https://nodejs.org/) (v18.x or later)
*   [MetaMask Browser Extension](https://metamask.io/)

---

### Step 1: Start the Local Blockchain Node
Start the Hardhat network simulator. This creates a local Ethereum node running on your machine and generates 20 pre-funded test accounts (10,000 ETH each).

```bash
cd Backend
npm install
npx hardhat node
```
*Keep this terminal window open.*

---

### Step 2: Deploy the Smart Contract
Open a new terminal. Compile and deploy `TicketNFT.sol` to your running local blockchain.

```bash
cd Backend
npx hardhat run scripts/deploy.js --network localhost
```
This script deploys the smart contract and automatically writes its ABI and deployed address to `Frontend/config.js` for the website to read.

---

### Step 3: Start the Express Web Server
Run the local Express server to host the website and generate QR codes.

```bash
cd ../server
npm install
node server.js
```
The application will start running on **[http://localhost:3000](http://localhost:3000)**.

---

### Step 4: Configure MetaMask

1.  **Add the Hardhat Network:**
    *   Open MetaMask and click the Network selection dropdown.
    *   Click **Add Network** > **Add a network manually**.
    *   Enter the following settings:
        *   **Network Name:** `Hardhat Local`
        *   **New RPC URL:** `http://127.0.0.1:8545`
        *   **Chain ID:** `31337`
        *   **Currency Symbol:** `ETH`
    *   Click **Save** and switch to the network.
2.  **Import Test Accounts:**
    *   Copy the **Private Keys** printed in your Hardhat Node terminal (Step 1).
    *   In MetaMask, click the account icon > **Import Account**.
    *   Import **Account #0** (Organizer), **Account #1** (Buyer), and **Account #2** (Verifier).

---

## 🛡️ The 3-Step Secure Gate Verification Workflow

Traditional digital ticket QR codes are easily copied or screenshotted. TicketNFT implements a secure verification protocol to defeat this:

```
[Step 1: On-Chain Check] ──► [Step 2: Cryptographic Signature] ──► [Step 3: Mark Used]
Verifier scans QR.           Attendee signs a zero-gas challenge.   Verifier marks ticket
Checks NFT ownership &       Proves wallet ownership.               used on-chain. Blocks
used status on-chain.        Defeats screenshots.                   future entry attempts.
```

1.  **Step 1: On-Chain Validity Check**
    The gate verifier scans the attendee's ticket QR code (containing Token ID & Wallet address). The frontend queries the smart contract via `isTicketValid()` to verify on-chain ownership and ensure the ticket hasn't been used.
2.  **Step 2: Proof of Wallet Ownership**
    The attendee connects their MetaMask wallet to the dApp. The site challenges them to sign a message containing a timestamp and the ticket ID. Because message signing requires their wallet's private key, **a screenshot of a QR code cannot pass this step.** Signing is a cryptographic calculation—it is **100% free and costs zero gas.**
3.  **Step 3: Entry Grant & Deactivation**
    Upon successful signature recovery, the verifier account signs a transaction calling `markUsed(tokenId)` on the smart contract. Once mined, `usedTickets[tokenId]` becomes `true` permanently, blocking any future entry attempts.

---

## 🧪 Running Unit Tests

Solidity unit tests verify the security rules (such as enforcing the 120% resale cap, organizer royalties, reentrancy protection, and verifier permissions).

To run these tests, you can use the **Solidity Unit Testing** plugin inside the [Remix IDE](https://remix.ethereum.org).
Detailed test cases are outlined in the **[Project_Report.md](file:///home/vishn/Documents/Project/BlockChain/Notes/Project_Report.md)**.

---

## 📚 Documentation Links
*   If you are new to blockchain, read the beginner-friendly walkthrough: **[Blockchain_Newbie_Guide.md](file:///home/vishn/Documents/Project/BlockChain/Notes/Blockchain_Newbie_Guide.md)**.
*   For the formal academic report and threat modeling details, see: **[Project_Report.md](file:///home/vishn/Documents/Project/BlockChain/Notes/Project_Report.md)**.
