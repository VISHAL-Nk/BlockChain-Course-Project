# The Plain-English Guide to TicketNFT: A Beginner's Step-by-Step Walkthrough

Welcome! If you are new to blockchain, smart contracts, and Web3, this guide is written specifically for you. We will break down every single concept, command, and workflow in this project with zero jargon left unexplained. By the end of this guide, you will understand exactly how this application works, how to run it, and why blockchain is a game-changer for event ticketing.

---

## 1. Core Blockchain Concepts (For Absolute Beginners)

Before we start running commands, let's understand the vocabulary of this project.

### What is a Blockchain?
Think of a **blockchain** as a digital notebook (a ledger) that is shared across thousands of computers. 
* **Immutable (Tamper-proof):** Once something is written in this notebook, it can never be deleted or changed. Anyone who tries to modify their notebook will be ignored because all other computers will see that it doesn't match their copies.
* **Decentralized:** There is no single owner, central server, or company (like Google or Ticketmaster) controlling it. The network is run by consensus.

### What is a Smart Contract?
A **smart contract** is a small computer program that lives and runs directly on the blockchain. 
* It works like a digital vending machine: if you insert the correct amount of money (cryptocurrency) and press a button, it is guaranteed by code to dispense the item.
* No human middleman can stop it, interfere, or change the rules once it is deployed. Our contract is written in a language called **Solidity** and is named [TicketNFT.sol](file:///home/vishn/Documents/Project/BlockChain/Backend/contracts/TicketNFT.sol).

### What is an NFT (Non-Fungible Token)?
* **Fungible:** An item that can be replaced by another identical item. For example, a $10 bill is fungible. If you loan a friend $10, you don't care if they return the exact same piece of paper; any $10 bill will do.
* **Non-Fungible:** An item that is completely unique and cannot be replaced. A concert ticket with a specific section, row, and seat number is non-fungible.
* **NFT:** A digital certificate of ownership stored on the blockchain. In our project, each ticket is minted as an **ERC-721 token** (the global standard for NFTs). Each ticket has a unique token ID (e.g., Ticket #0, Ticket #1), making it impossible to duplicate or forge.

### What is a Crypto Wallet and MetaMask?
* A **wallet** is a tool that holds your cryptographic keys. It doesn't actually store your coins or NFTs; they live on the blockchain. Your wallet holds your **private keys** (which act like a secure signature or password) and your **public address** (which acts like your email or bank account number that others use to send you funds).
* **MetaMask** is a browser extension that acts as your wallet. It bridges your web browser (Chrome, Firefox, Brave) to the blockchain network so that web applications can request your signature or payment.

---

## 2. Project Architecture (How the Layers Talk)

Our TicketNFT application is divided into three layers:

```
┌────────────────────────────────────────────────────────┐
│               L3: Frontend Web Interface               │
│         (HTML, CSS, Javascript + Ethers.js)            │
│         Connected via MetaMask in the browser          │
└──────────────────────────┬─────────────────────────────┘
                           │
             Reads & Writes transactions
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│           L1: Local Ethereum Blockchain                │
│             (Hardhat Local Node Network)               │
│         Executes TicketNFT.sol Smart Contract          │
└──────────────────────────┬─────────────────────────────┘
                           │
             Saves off-chain metadata URL
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│             L2: Metadata & Storage Layer               │
│          (IPFS / Pinata API + Express Server)          │
│       Stores ticket artwork images and details         │
└────────────────────────────────────────────────────────┘
```

1. **The Blockchain Layer (Hardhat):** A local simulation of the Ethereum network running on your computer. It executes our smart contract, handles transactions, and maintains the master ledger of who owns which ticket.
2. **The Storage Layer (IPFS/Pinata):** Storing images directly on a blockchain is extremely expensive. Instead, we store the ticket image and descriptive text (JSON metadata) on **IPFS** (InterPlanetary File System, a decentralized file network) via a service called **Pinata**. The blockchain NFT simply stores a link (a Content Identifier or CID) pointing to this file.
3. **The Frontend Layer (Web App):** A website built with plain HTML/CSS/JS. It uses a JavaScript library called **Ethers.js** to talk to MetaMask, which in turn talks to our Hardhat blockchain.

---

## 3. Step-by-Step Setup Guide

Let's get the application up and running! Follow these steps in order.

### Step 3.1: Start the Blockchain (Hardhat Node)
Open a terminal, navigate to the `Backend` directory, and start the local blockchain network. This creates a simulator running on your computer that acts exactly like the real Ethereum network, giving you 20 test accounts, each pre-funded with 10,000 fake Ether (ETH) for testing.

```bash
cd /home/vishn/Documents/Project/BlockChain/Backend
npx hardhat node
```
*Keep this terminal open.* It will print a list of 20 accounts (addresses) and their **Private Keys**. We will need these private keys in MetaMask.

### Step 3.2: Compile and Deploy the Smart Contract
Open a **second terminal** window. We need to deploy our smart contract code onto the local blockchain we just started.

```bash
cd /home/vishn/Documents/Project/BlockChain/Backend
npx hardhat run scripts/deploy.js --network localhost
```
When this command finishes, it does two things:
1. It deploys the `TicketNFT.sol` contract and prints its address (e.g., `TicketNFT deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3`).
2. It automatically generates a file named `config.js` inside the `Frontend` folder containing the contract's address and its **ABI** (Application Binary Interface—a JSON map of all the contract's functions, which the frontend uses to communicate with it).

### Step 3.3: Start the Web Server
In the **second terminal**, navigate to the `server` directory and start the Node.js Express server.

```bash
cd /home/vishn/Documents/Project/BlockChain/server
node server.js
```
This starts the local web server on **http://localhost:3000**. It serves the web UI and provides utility APIs (like generating QR codes and uploading files to IPFS).
*If you don't have Pinata API keys configured, the server automatically runs in **Demo Mode**, generating simulated IPFS links so you can test all features offline without signing up for anything!*

---

## 4. Configuring MetaMask in Your Browser

Now we need to connect your browser's MetaMask wallet to our local blockchain network.

### 1. Add the Hardhat Local Network to MetaMask
By default, MetaMask is connected to the real Ethereum network ("Mainnet"). Let's point it to our local simulator:
1. Open the MetaMask browser extension.
2. Click the Network selection button in the top-left corner (it might say "Ethereum Mainnet" or "Linea").
3. Click **Add Network** > **Add a network manually** (at the bottom of the list).
4. Fill in these exact details:
   * **Network Name:** `Hardhat Local`
   * **RPC URL:** `http://127.0.0.1:8545`
   * **Chain ID:** `31337` (This is Hardhat's default chain ID)
   * **Currency Symbol:** `ETH`
5. Click **Save** and select **Switch to Hardhat Local**.

### 2. Import Test Accounts into MetaMask
Your local Hardhat blockchain started with 20 pre-funded test accounts. Let's import the first three into MetaMask so you can play different roles:
1. Look at the terminal where you ran `npx hardhat node` (Step 3.1). Look under the list of `Private Keys`.
2. Open MetaMask, click the account selector icon (top-middle drop-down), and click **Add account or hardware wallet** > **Import account**.
3. Copy the private key for **Account #0** (usually starts with `0xac09...`) and paste it into MetaMask. Click **Import**. Rename this account to **"Organizer"** in MetaMask settings.
4. Repeat this process to import **Account #1** (starts with `0x59c6...`), and rename it to **"Buyer"**.
5. Repeat to import **Account #2** (starts with `0x5de4...`), and rename it to **"Verifier"**.

Now you are fully set up to test!

---

## 5. Walking Through the Features

Open your browser and navigate to **http://localhost:3000**.

### 🎫 Phase 1: Creating an Event (As the Organizer)
1. In MetaMask, switch to your **Organizer** account (Account #0).
2. Click **Connect Wallet** on the website. The page will detect that you are the contract owner and unlock the **Organizer Dashboard** tab.
3. Go to the **Organizer Dashboard** tab:
   * Fill out the form: Event Name (e.g., "Rock Concert"), Date, Venue, Category, Max Tickets (e.g., `10`), and Ticket Price in ETH (e.g., `0.01`).
   * Click **Create Event**.
   * MetaMask will pop up asking you to approve the transaction. Since this is local, it uses fake gas and fake ETH! Click **Confirm**.
   * Wait a few seconds. You will see a success notification, and the event will appear in the "Browse Events" tab.

### 🦊 Phase 2: Buying a Ticket (As the Buyer)
1. In MetaMask, switch your account to the **Buyer** (Account #1).
2. On the website, go to the **Browse Events** tab.
3. Click **Buy Ticket** on the event you just created.
4. MetaMask will open, showing that you are sending `0.01 ETH` to the smart contract. Click **Confirm**.
5. Once confirmed, go to the **My Tickets** tab. You will see your newly minted NFT! It displays the token ID (e.g., `#0`), the event name, and has buttons to "Show QR" or "List for Resale".

### 📈 Phase 3: Secondary Resale & Royalties
One of the best features of smart contract ticketing is controlling the secondary market to stop scalpers (price gougers).
1. While logged in as the **Buyer** (Account #1) on the **My Tickets** tab, click **List for Resale** on your ticket.
2. Enter a resale price. Note that the smart contract enforces a **maximum 120% cap** of the original price. If the ticket originally cost `0.01 ETH`, you cannot list it for more than `0.012 ETH`. Try listing it for `0.05 ETH`—it will revert and block the sale!
3. List the ticket for a valid price like `0.011 ETH` and confirm the transaction in MetaMask.
4. Now, switch MetaMask to **Account #3** (or any other account besides Buyer and Organizer) to simulate a secondary buyer.
5. Go to the **Resale Marketplace** tab on the website and click **Buy** on the listed ticket.
6. When this resale transaction completes:
   * The NFT ticket ownership is transferred to the new buyer.
   * **10% of the resale price** (`0.0011 ETH`) is automatically paid directly to the **Organizer** as a royalty!
   * The remaining **90%** goes to the seller (Account #1).
   * This is entirely coded into the smart contract function `buyResaleTicket`—nobody can cheat!

---

## 6. The Secure 3-Step Gate Verification Protocol

A major flaw with digital tickets is **screenshot fraud**: someone takes a screenshot of their ticket's QR code, sends it to a friend, or sells the screenshot to multiple people. The first person to scan it gets in; the rest are locked out.

To solve this, our platform uses a **secure 3-step dual-confirmation protocol**. It proves that the person at the gate actually controls the private key of the wallet holding the NFT ticket.

### How the Flow Works:

```
┌────────────────────────────────────────┐
│  Attendee shows QR code at the gate    │
│  (QR encodes: Token ID & Wallet Addr)  │
└──────────────────┬─────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────┐
│     Step 1: On-Chain Validity Check    │
│  Verifier scans QR. Website queries    │
│  blockchain: Does this wallet own this │
│  ticket? Has it been used before?      │
└──────────────────┬─────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────┐
│     Step 2: Cryptographic Signature    │
│  Attendee's MetaMask opens on phone.   │
│  Attendee signs a free challenge.      │
│  Verifier's screen confirms signature.  │
└──────────────────┬─────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────┐
│       Step 3: Burn / Mark as Used      │
│  Verifier signs contract transaction   │
│  calling markUsed() on-chain.          │
│  Ticket is permanently inactivated.    │
└────────────────────────────────────────┘
```

#### Step 1: On-Chain Validity Check
The attendee displays their ticket's QR code. The gate verifier clicks **Start Camera Scanner** (or types the details manually) and scans the QR.
* The QR contains two items: the **Token ID** and the **Wallet Address** of the ticket holder.
* The app automatically queries the smart contract: `isTicketValid(tokenId, walletAddress)`.
* It verifies that the wallet address actually owns that token ID on-chain, and that the `usedTickets` flag is still false. If valid, Step 2 is unlocked.

#### Step 2: Proof of Ownership (Impersonation Prevention)
This is where screenshot fraud is defeated. 
* To prove they are not just showing a screenshot of someone else's QR code, the attendee must connect their MetaMask wallet and click **Prove Ownership**.
* The website sends a unique "challenge" message to their MetaMask:
  `I am the owner of TicketNFT Token #X. Timestamp: 1716... Contract: 0x...`
* The attendee signs this message. In cryptography, **signing** uses the wallet's private key to encrypt the message. 
* The website recovers the signer's address from this signature. If the signature matches the wallet address scanned from the QR code, the verifier knows that **the person standing in front of them actually owns the private key of that wallet**. 
* *Cost:* Message signing is a local cryptographic operation—it does **not** write to the blockchain, meaning it is **100% free and costs zero gas!**

#### Step 3: Mark as Used (Double-Entry Prevention)
Once ownership is verified, Step 3 unlocks for the gate staff.
* The verifier (who must have the authorized "Verifier" role set by the organizer) signs a blockchain transaction calling the smart contract's `markUsed(tokenId)` function.
* This transaction writes directly to the blockchain ledger, setting `usedTickets[tokenId] = true`.
* Once mined, this ticket is permanently deactivated. If anyone tries to scan the same QR code (or a screenshot) again, the system will fail at **Step 1** because `isTicketValid` will return `false`.

---

## 7. Troubleshooting Common Developer Issues

When testing local blockchain applications, you will occasionally run into these three common stumbling blocks:

### 1. MetaMask "Nonce Too High" Error
* **The Symptom:** You send a transaction, and it immediately fails, or MetaMask shows an error containing the word "nonce".
* **The Cause:** Every transaction sent from an account has a sequential number (a nonce) starting at 0. If you restart your Hardhat node, Hardhat resets its internal nonces to 0. However, MetaMask remembers the last nonce you used (e.g., 5) and gets confused because the local blockchain expects 0.
* **The Fix:** In MetaMask:
  1. Click your account icon in the top-right corner.
  2. Go to **Settings** > **Advanced**.
  3. Scroll down and click **Clear activity tab data** (or **Reset Account** on older versions). This clears MetaMask's transaction cache for the local network without deleting your accounts. Try the transaction again.

### 2. "Caller is not a verifier" Rejection
* **The Symptom:** When trying to complete Step 3 of the verification flow, the transaction fails with this message.
* **The Cause:** Only wallet addresses explicitly authorized by the Organizer can call the `markUsed` function.
* **The Fix:** 
  1. Switch MetaMask back to your **Organizer** account.
  2. Go to the **Organizer Dashboard** tab.
  3. Under **Set Verifier**, paste your **Verifier** wallet address (Account #2) and check the "Enable" box, then click **Set Verifier**. Approve the transaction.
  4. Switch MetaMask back to the **Verifier** account (Account #2) and click **Try Again** in Step 3.

### 3. Smart Contract Redeployment Issues
* **The Symptom:** You updated the Solidity contract, redeployed it, but the website is behaving strangely or reading old data.
* **The Cause:** Every time you run `npx hardhat run scripts/deploy.js`, the contract is deployed to a new address. The frontend needs to know this new address to talk to the correct contract.
* **The Fix:** The deploy script automatically writes the new address and ABI to `Frontend/config.js`. However, your browser might have cached the old version of `config.js`. **Force-refresh your browser** by pressing `Ctrl + Shift + R` (or `Cmd + Shift + R` on Mac) to clear the browser cache and load the latest configuration.
