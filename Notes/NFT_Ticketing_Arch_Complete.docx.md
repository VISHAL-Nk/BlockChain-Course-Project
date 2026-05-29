

**BLOCKCHAIN & DISTRIBUTED LEDGERS — VI SEMESTER**

**NFT-Based Secure Ticketing**

**& Verification Platform**

**COMPLETE PROJECT PLAN & IMPLEMENTATION GUIDE**

Arch Linux  •  Ganache-CLI  •  Remix IDE  •  Next.js  •  Ethers.js

| Student | Vishal |
| :---- | :---- |
| **Semester** | VI (Even) — Blockchain & Distributed Ledgers |
| **Operating System** | Arch Linux (100% — all work here) |
| **Local Blockchain** | Ganache-CLI (npm) — runs in Arch terminal |
| **Smart Contract IDE** | Remix IDE (browser) \+ remixd for local files |
| **Frontend Framework** | Next.js 14 (App Router) \+ Ethers.js v6 \+ Tailwind CSS |
| **NFT Standard** | ERC-721 (OpenZeppelin) on Solidity 0.8.x |

# **1\.  Project Overview**

## **1.1  Problem Statement**

Traditional event ticketing systems are built on centralized databases and easily copyable digital tickets. This architecture introduces three critical vulnerabilities that this project aims to eliminate:

* Ticket Duplication — the same digital ticket can be screenshot, forwarded, and used simultaneously by multiple people at different gates.

* Forgery — attackers produce convincing fake tickets that pass visual inspection but are not registered in any authoritative system.

* Unauthorized Scalping — resellers bypass purchase limits and resell at inflated prices, violating event policies and harming genuine fans.

These vulnerabilities lead to direct revenue loss for event organizers, poor experience for legitimate attendees, and costly overhead at entry gates.

## **1.2  NFT Solution — Core Insight**

| i | Every ticket is minted as an ERC-721 Non-Fungible Token on a local Ethereum blockchain. Owning the ticket means holding the NFT in your wallet. The blockchain is the sole source of truth — no screenshot, PDF, or duplicate can impersonate on-chain ownership. |
| :---: | :---- |

The platform gives three distinct roles their own capabilities:

| Actor | Role | What They Can Do |
| ----- | ----- | ----- |
| Event Organizer | Admin | Deploy contract, create events, set ticket limits & price, mint NFTs, set verifiers, withdraw ETH, cancel events |
| Buyer / Attendee | User | Connect MetaMask, purchase ticket NFT, view QR code of owned ticket, resell if policy allows |
| Verifier / Gate Staff | Scanner | Scan QR, query blockchain for ownership, mark ticket as used permanently |

## **1.3  Blockchain Concepts Glossary**

Every term used in this project — explained in plain English before you write a single line of code:

| Term | Plain-English Meaning |
| ----- | ----- |
| Blockchain | A chain of blocks where each block contains transactions. Altering any block requires redoing all subsequent blocks — computationally infeasible. This tamper-proofing is the foundation of the whole system. |
| Smart Contract | A program stored and executed on the blockchain. It runs automatically when conditions are met — no middleman. Like a vending machine: correct input always produces correct output, guaranteed by code. |
| ERC-721 / NFT | The Ethereum standard for Non-Fungible Tokens. Each token has a unique ID. No two token IDs are identical — making them perfect for representing one unique ticket. |
| Solidity | The programming language for Ethereum smart contracts. Syntax similar to JavaScript/C++. Compiled to bytecode and stored permanently on the blockchain. |
| Ganache-CLI | A command-line tool that creates a simulated local Ethereum blockchain on your machine. It gives you 10 pre-funded test accounts with 100 ETH each — no real money. Runs entirely in your Arch Linux terminal. |
| Remix IDE | A browser-based IDE at remix.ethereum.org. Write, compile, deploy, and test Solidity contracts. Can connect to your local Ganache node via MetaMask. |
| remixd | An npm package that bridges Remix IDE in the browser to your local filesystem on Arch Linux. Edit .sol files with any local editor and have them live in Remix simultaneously. |
| MetaMask | A browser extension that manages Ethereum keys and acts as your wallet. Injects window.ethereum into web pages. Your Next.js frontend talks to the blockchain through MetaMask. |
| OpenZeppelin | An audited library of Solidity contracts. We import their ERC721 implementation rather than writing the full NFT standard from scratch — saving time and eliminating security bugs. |
| IPFS / Pinata | InterPlanetary File System — decentralized storage. Pinata.cloud is a free service that pins files to IPFS and gives you a CID (Content ID). Ticket metadata (name, image, seat) is stored here, referenced by the NFT. |
| ABI | Application Binary Interface — the JSON description of your contract's functions. Next.js uses the ABI to know how to call contract functions and decode return values. |
| tokenURI | A URL in each NFT that points to its metadata JSON (usually on IPFS). MetaMask reads this to display the ticket image and details in the wallet. |
| ownerOf(id) | Built-in ERC-721 function. Returns the wallet address that currently owns a specific ticket NFT. This one function powers the entire verification system. |
| Gas | The computational cost of a transaction, paid in ETH. On Ganache (local testnet), gas uses fake ETH — completely free. On mainnet, it's real money. |
| Wei | The smallest unit of ETH. 1 ETH \= 1,000,000,000,000,000,000 Wei (10^18). All ETH values in Solidity are in Wei — never in ETH directly. |

# **2\.  Environment Setup on Arch Linux**

| \! | Follow every step in order. Do not skip steps. Each section builds on the previous one. |
| :---: | :---- |

## **2.1  System Update & Base Tools**

Always update Arch before installing new packages to avoid dependency conflicts:

| Terminal | sudo pacman \-Syu |
| :---: | :---- |

| Terminal | sudo pacman \-S git curl base-devel |
| :---: | :---- |

## **2.2  Install Node.js & npm**

The entire project toolchain — Ganache, remixd, Next.js — runs on Node.js. Install the LTS version:

| Terminal | sudo pacman \-S nodejs npm |
| :---: | :---- |

| Verify | node \-v    \# must be \>= 18.x npm \-v     \# must be \>= 9.x |
| :---: | :---- |

| i | If Arch's nodejs package is older than v18, install nvm (Node Version Manager) instead: use the AUR package nvm, then: nvm install \--lts && nvm use \--lts |
| :---: | :---- |

## **2.3  Install Ganache-CLI**

Ganache-CLI is the command-line version of Ganache. It runs a local Ethereum blockchain entirely in your terminal — no GUI, no Windows needed.

| Terminal | npm install \-g ganache |
| :---: | :---- |

| Verify | ganache \--version    \# should show Ganache v7.x |
| :---: | :---- |

## **2.4  Install remixd**

remixd bridges Remix IDE (browser) to your local Arch Linux filesystem. This lets you edit .sol files locally and have them appear in Remix automatically.

| Terminal | npm install \-g @remix-project/remixd |
| :---: | :---- |

| Verify | remixd \--version |
| :---: | :---- |

## **2.5  Install MetaMask in Your Browser**

MetaMask is a browser extension — install it from the official extension store for your browser (Chrome, Brave, or Firefox):

1. Go to: metamask.io/download — click Install MetaMask.

2. Click through the setup wizard. Create a new wallet. Save your 12-word seed phrase in a text file (this is a test wallet, not for real funds).

3. After setup, MetaMask appears as an icon in your browser toolbar.

## **2.6  Install Next.js Project Dependencies**

We will set up the Next.js project in Phase 5\. For now, verify npx works:

| Verify | npx \--version    \# comes with npm, should already work |
| :---: | :---- |

## **2.7  Install IPFS (Optional — Pinata is easier)**

You have two options for storing ticket metadata. Pinata (cloud) is recommended for simplicity:

| Option | Tool | How to Use |
| ----- | ----- | ----- |
| Recommended | Pinata.cloud (free account) | Create account, upload JSON/image files via web UI, get CID instantly. No install needed. |
| Alternative | Local IPFS daemon | sudo pacman \-S ipfs, then: ipfs init && ipfs daemon, then: ipfs add metadata.json |

## **2.8  Full Environment Summary**

| Tool | Install Command | Version Check | Purpose |
| ----- | ----- | ----- | ----- |
| Node.js | sudo pacman \-S nodejs | node \-v (\>= 18\) | Runtime for all JS tools |
| npm | sudo pacman \-S npm | npm \-v (\>= 9\) | Package manager |
| Ganache-CLI | npm install \-g ganache | ganache \--version | Local Ethereum blockchain |
| remixd | npm install \-g @remix-project/remixd | remixd \--version | Bridge Remix to local files |
| git | sudo pacman \-S git | git \--version | Version control |
| MetaMask | Browser extension | Icon in toolbar | Wallet & blockchain bridge |
| Remix IDE | remix.ethereum.org (browser) | Opens in browser | Write & deploy contracts |
| Next.js | npx create-next-app (Phase 5\) | npm run dev starts server | Frontend framework |
| Pinata.cloud | Account at pinata.cloud | Upload via web UI | IPFS metadata storage |

# **3\.  System Architecture**

## **3.1  Four-Layer Stack**

| L\# | Layer | Technology | What It Handles |
| ----- | ----- | ----- | ----- |
| L1 | Blockchain | Ganache-CLI (local Ethereum) | Smart contract execution, NFT ownership ledger, immutable ticket registry, payment settlement |
| L2 | Metadata Storage | IPFS via Pinata.cloud | Off-chain ticket metadata (event name, date, venue, seat, ticket image) — referenced by on-chain tokenURI |
| L3 | Smart Contracts | Solidity 0.8.x \+ OpenZeppelin | TicketNFT.sol: minting, purchase, verification, used-flag, tokenURI. TicketMarket.sol: optional secondary resale |
| L4 | Frontend | Next.js 14 \+ Ethers.js v6 \+ Tailwind | Buyer portal, organizer dashboard, gate verifier app — all connect to blockchain via MetaMask |

## **3.2  How Everything Connects — Data Flow for Ticket Purchase**

4. Organizer starts Ganache-CLI in terminal. Opens Remix IDE in browser. Connects Remix to Ganache via MetaMask (Web3 Provider).

5. Organizer deploys TicketNFT.sol from Remix. The contract lives at a specific address on Ganache. Organizer copies the contract address and ABI.

6. Organizer calls createEvent() in Remix: passes event name, max tickets, price in Wei, and IPFS CID of event metadata JSON.

7. Buyer opens the Next.js frontend in browser. Clicks Connect Wallet — MetaMask pops up. Buyer connects their Ganache test account.

8. Buyer selects an event and clicks Buy Ticket. Frontend calls purchaseTicket(eventId) via Ethers.js with the required ETH attached.

9. MetaMask shows the transaction confirmation popup. Buyer clicks Confirm.

10. Ganache mines the transaction. Smart contract mints a new ERC-721 token (unique ticket NFT) and transfers ownership to the buyer's wallet address.

11. The NFT's tokenURI points to the IPFS metadata JSON. MetaMask displays the ticket with event name, date, and image.

12. Frontend fetches all ticket NFTs owned by the connected wallet and generates a QR code for each.

## **3.3  How Everything Connects — Data Flow for Gate Verification**

13. Gate verifier opens the /verify page of the Next.js app on any device connected to the same network.

14. Attendee presents their QR code — which encodes their wallet address and the token ID of their ticket NFT.

15. Verifier scans QR. The app decodes it to get walletAddress and tokenId.

16. App calls ownerOf(tokenId) on the smart contract via Ethers.js.

17. If ownerOf returns the attendee's wallet address AND isUsed(tokenId) is false — ticket is valid. Green badge shown.

18. Verifier clicks Mark Entry. App calls markUsed(tokenId). Ganache mines the transaction.

19. Now isUsed(tokenId) is permanently true on-chain. The same QR will return red at any gate.

| ✓ | Key security property: markUsed() writes to Ganache's blockchain. All verifiers at all gates share the same on-chain state. There is no central server that can be hacked to reset ticket status. |
| :---: | :---- |

# **4\.  Smart Contract Design**

## **4.1  Contract Files**

| File | Inherits From | Purpose |
| ----- | ----- | ----- |
| TicketNFT.sol | ERC721, Ownable, ReentrancyGuard | Primary: events, minting, purchasing, verification, used-flag, tokenURI override |
| TicketMarket.sol | ReentrancyGuard | Optional bonus: secondary resale listing, price cap, organizer royalty on resale |

## **4.2  TicketNFT.sol — Complete Structure**

### **State Variables**

| Variable | Type | Purpose |
| ----- | ----- | ----- |
| struct Event { ... } | — | eventId, name, organizer, maxTickets, ticketsSold, priceWei, metadataCID, isActive |
| events | mapping(uint=\>Event) | All events indexed by their ID |
| usedTickets | mapping(uint=\>bool) | Whether each token ID has been used for entry |
| ticketEvent | mapping(uint=\>uint) | Maps each token ID back to its event ID |
| verifiers | mapping(address=\>bool) | Addresses authorized to call markUsed() |
| \_eventCounter | uint256 | Auto-incrementing ID for events (starts at 0\) |
| \_tokenCounter | uint256 | Auto-incrementing token ID for each minted NFT |

### **Functions**

| Function | Modifier | What It Does |
| ----- | ----- | ----- |
| createEvent(name,max,price,cid) | onlyOwner | Creates new event struct, stores it, increments counter, emits EventCreated |
| purchaseTicket(eventId) | payable | Validates event active, supply remaining, ETH correct. Mints NFT to msg.sender. Emits TicketPurchased. |
| markUsed(tokenId) | onlyVerifier | Sets usedTickets\[tokenId\]=true permanently. Emits TicketUsed. |
| isTicketValid(tokenId,addr) | view | Returns true if: addr==ownerOf(tokenId) AND usedTickets\[tokenId\]==false |
| tokenURI(tokenId) | view override | Returns 'ipfs://{metadataCID}' for the event this ticket belongs to |
| setVerifier(addr,status) | onlyOwner | Grant or revoke verifier role for a wallet address |
| withdrawFunds() | onlyOwner nonReentrant | Sends accumulated ETH from sales to owner wallet |
| cancelEvent(eventId) | onlyOwner | Sets isActive=false. Blocks all future purchases. |
| getEvent(eventId) | view | Returns full Event struct — used by frontend to display event details |
| totalEvents() | view | Returns total number of events created — used for frontend pagination |

## **4.3  Solidity Events (Log Emissions)**

Solidity events emit logs to the blockchain that your Next.js frontend can listen for in real-time using Ethers.js:

| Event | Parameters Emitted |
| ----- | ----- |
| EventCreated | uint eventId, string name, uint maxTickets, uint priceWei, address organizer |
| TicketPurchased | uint tokenId, uint eventId, address buyer, uint pricePaid |
| TicketUsed | uint tokenId, uint eventId, address usedBy, uint timestamp |
| EventCancelled | uint eventId, address cancelledBy |

## **4.4  Security — Attacks and Mitigations**

| Attack Vector | Mitigation | How It Is Implemented |
| ----- | ----- | ----- |
| Double-entry | usedTickets mapping | markUsed() is a one-way write. isTicketValid() checks the flag. Second scan returns false permanently. |
| Ticket forgery | Blockchain ownership is authoritative | ownerOf() on-chain cannot be faked. No screenshot or PDF can match a real wallet address. |
| Unauthorized minting | onlyOwner on createEvent | Only the deployer wallet can create events. No one else can mint tickets. |
| Reentrancy on withdrawal | ReentrancyGuard from OpenZeppelin | nonReentrant modifier on withdrawFunds() prevents recursive ETH drain. |
| Integer overflow | Solidity 0.8+ built-in protection | Arithmetic overflow auto-reverts. No SafeMath library needed. |
| Unauthorized gate marking | onlyVerifier modifier | markUsed() reverts if caller not in verifiers mapping. Owner sets verifiers via setVerifier(). |
| Excess ETH supply | maxTickets check in purchaseTicket | Reverts when ticketsSold \>= maxTickets. Hard cap enforced at contract level. |

## **4.5  OpenZeppelin Imports — What Each Provides**

| Import | What You Get for Free |
| ----- | ----- |
| @openzeppelin/contracts/token/ERC721/ERC721.sol | Full ERC-721 implementation: balanceOf, ownerOf, transferFrom, approve, safeTransferFrom, tokenURI |
| @openzeppelin/contracts/access/Ownable.sol | owner() state variable, onlyOwner modifier, transferOwnership() function |
| @openzeppelin/contracts/security/ReentrancyGuard.sol | nonReentrant modifier that prevents reentrant calls on ETH-sending functions |
| @openzeppelin/contracts/utils/Counters.sol | Safe incrementing counter — use for \_tokenCounter and \_eventCounter |

| i | In Remix IDE, OpenZeppelin imports resolve automatically from npm. Just write the import line — Remix downloads the library on compile. No npm install needed for the contract itself. |
| :---: | :---- |

# **5\.  Ganache-CLI Setup & Remix Connection**

## **5.1  Start Ganache-CLI**

Ganache-CLI runs in a terminal and simulates a full Ethereum blockchain locally. You will keep this terminal open throughout your entire development session.

| Terminal 1 — Keep Open | ganache \--port 8545 \--chain.chainId 1337 \--deterministic |
| :---: | :---- |

Breaking down these flags:

| Flag | What It Does |
| ----- | ----- |
| \--port 8545 | Sets the RPC port to 8545 — the Ethereum standard. MetaMask will connect to http://127.0.0.1:8545 |
| \--chain.chainId 1337 | Sets chain ID to 1337 — the standard ID for local development. Required by MetaMask when adding a custom network. |
| \--deterministic | Uses a fixed mnemonic seed phrase so the same 10 accounts appear every time you restart Ganache. Critical for consistency. |

When Ganache starts, it prints 10 accounts with their addresses and private keys. You will see output like:

| Ganache Output | Available Accounts \================== (0) 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (100 ETH) (1) 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 (100 ETH) ... Private Keys \============ (0) 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 ... RPC Listening on 127.0.0.1:8545 |
| :---: | :---- |

| \! | Copy and save these addresses and private keys in a text file. You will need them to import accounts into MetaMask and to configure your Next.js frontend. |
| :---: | :---- |

## **5.2  Add Ganache Network to MetaMask**

20. Click the MetaMask extension icon in your browser.

21. Click the network dropdown at the top (shows 'Ethereum Mainnet' by default).

22. Click Add Network \> Add a Network Manually.

23. Fill in these exact values:

| MetaMask Field | Value to Enter |
| ----- | ----- |
| Network Name | Ganache Local |
| New RPC URL | http://127.0.0.1:8545 |
| Chain ID | 1337 |
| Currency Symbol | ETH |
| Block Explorer URL | (leave blank) |

24. Click Save. MetaMask now shows 'Ganache Local' as the active network.

## **5.3  Import Ganache Accounts into MetaMask**

25. In MetaMask, click the account icon (top right) \> Import Account.

26. Select type: Private Key.

27. Paste the private key for Account (0) from Ganache's output. Click Import.

28. Repeat for Account (1) and Account (2). You now have three test accounts:

| Account | Role in Project | Why This Account |
| ----- | ----- | ----- |
| Account (0) | Organizer / Owner | Deploys the contract. Only this account can call onlyOwner functions. |
| Account (1) | Buyer | Purchases ticket NFTs. Switch to this in MetaMask when testing purchases. |
| Account (2) | Gate Verifier | Will be granted verifier role. Calls markUsed() at the gate. |

## **5.4  Connect Remix IDE to Ganache**

29. Open remix.ethereum.org in your browser.

30. In the Deploy & Run Transactions tab (Ethereum icon on left sidebar):

31. Click the Environment dropdown. Select: Injected Provider – MetaMask.

32. MetaMask pops up asking to connect — click Connect.

33. The Account field in Remix now shows your Ganache account address and 100 ETH balance.

34. You are now deploying directly to your Ganache local blockchain.

| ✓ | This is the critical link: Remix IDE in browser → MetaMask browser extension → Ganache-CLI running in your Arch Linux terminal. All three must be active at the same time. |
| :---: | :---- |

# **6\.  Writing & Deploying the Smart Contract in Remix**

## **6.1  Remix IDE Interface — Panel Reference**

| Icon / Panel | What It Does |
| ----- | ----- |
| File Explorer (folder) | Create and manage .sol files. Files are saved in browser local storage by default. |
| Solidity Compiler (S) | Compile your contract. Choose version here. ABI is available here after compile. |
| Deploy & Run (Ethereum) | Deploy contracts, call functions, switch accounts. Most-used panel during development. |
| Plugin Manager (puzzle) | Enable Solidity Unit Testing plugin for writing in-Remix tests. |
| Terminal (bottom) | Shows all transactions, return values, errors, and gas usage. Essential for debugging. |

## **6.2  Setting Up Local File Access with remixd**

Instead of working in Remix's browser storage (which can be lost on clear), use remixd to link Remix to a folder on your Arch Linux filesystem:

35. Create your project folder:

| Terminal 2 | mkdir \~/nft-ticketing && mkdir \~/nft-ticketing/contracts && cd \~/nft-ticketing |
| :---: | :---- |

36. Start remixd pointing to your contracts folder:

| Terminal 2 | remixd \-s \~/nft-ticketing/contracts \--remix-ide https://remix.ethereum.org |
| :---: | :---- |

37. In Remix: click the folder icon in the sidebar. You will see a 'localhost' section. Click Connect to Localhost.

38. Your contracts/ folder now appears in Remix. Any .sol file you create in Remix saves to your Arch Linux disk.

39. You can also edit the .sol files in any local editor (VS Code, Neovim, etc.) and changes appear in Remix automatically.

## **6.3  Writing TicketNFT.sol — Section by Section**

Create a new file in Remix: TicketNFT.sol. Write each section below in order, compiling after each to catch errors early.

### **Section A — Pragma, License & Imports**

| Solidity | // SPDX-License-Identifier: MIT pragma solidity ^0.8.20; import "@openzeppelin/contracts/token/ERC721/ERC721.sol"; import "@openzeppelin/contracts/access/Ownable.sol"; import "@openzeppelin/contracts/security/ReentrancyGuard.sol"; |
| :---: | :---- |

### **Section B — Contract Declaration & State Variables**

| Solidity | contract TicketNFT is ERC721, Ownable, ReentrancyGuard {     struct Event {         uint256 eventId;         string  name;         address organizer;         uint256 maxTickets;         uint256 ticketsSold;         uint256 priceWei;         string  metadataCID;         bool    isActive;     }     mapping(uint256 \=\> Event)   public events;     mapping(uint256 \=\> bool)    public usedTickets;     mapping(uint256 \=\> uint256) public ticketEvent;     mapping(address \=\> bool)    private verifiers;     uint256 private \_eventCounter;     uint256 private \_tokenCounter; |
| :---: | :---- |

### **Section C — Solidity Events & Modifiers**

| Solidity |     event EventCreated(uint256 indexed eventId, string name, uint256 maxTickets, uint256 priceWei);     event TicketPurchased(uint256 indexed tokenId, uint256 indexed eventId, address buyer);     event TicketUsed(uint256 indexed tokenId, uint256 indexed eventId, uint256 timestamp);     event EventCancelled(uint256 indexed eventId);     modifier onlyVerifier() {         require(verifiers\[msg.sender\], "TicketNFT: caller is not a verifier");         \_;     } |
| :---: | :---- |

### **Section D — Constructor**

| Solidity |     constructor() ERC721("TicketNFT", "TNFT") Ownable(msg.sender) {} |
| :---: | :---- |

### **Section E — Core Functions**

| Solidity |     function createEvent(         string memory name,         uint256 maxTickets,         uint256 priceWei,         string memory metadataCID     ) external onlyOwner {         require(maxTickets \> 0, "TicketNFT: max tickets must be \> 0");         require(priceWei \> 0, "TicketNFT: price must be \> 0");         events\[\_eventCounter\] \= Event({             eventId:     \_eventCounter,             name:        name,             organizer:   msg.sender,             maxTickets:  maxTickets,             ticketsSold: 0,             priceWei:    priceWei,             metadataCID: metadataCID,             isActive:    true         });         emit EventCreated(\_eventCounter, name, maxTickets, priceWei);         \_eventCounter++;     }     function purchaseTicket(uint256 eventId) external payable {         Event storage evt \= events\[eventId\];         require(evt.isActive, "TicketNFT: event not active");         require(evt.ticketsSold \< evt.maxTickets, "TicketNFT: sold out");         require(msg.value \== evt.priceWei, "TicketNFT: incorrect ETH amount");         uint256 newTokenId \= \_tokenCounter;         \_tokenCounter++;         evt.ticketsSold++;         ticketEvent\[newTokenId\] \= eventId;         \_safeMint(msg.sender, newTokenId);         emit TicketPurchased(newTokenId, eventId, msg.sender);     }     function markUsed(uint256 tokenId) external onlyVerifier {         require(\_exists(tokenId), "TicketNFT: token does not exist");         require(\!usedTickets\[tokenId\], "TicketNFT: ticket already used");         usedTickets\[tokenId\] \= true;         emit TicketUsed(tokenId, ticketEvent\[tokenId\], block.timestamp);     } |
| :---: | :---- |

### **Section F — View Functions & Overrides**

| Solidity |     function isTicketValid(uint256 tokenId, address wallet) public view returns (bool) {         return ownerOf(tokenId) \== wallet && \!usedTickets\[tokenId\];     }     function tokenURI(uint256 tokenId)         public view override returns (string memory) {         require(\_exists(tokenId), "TicketNFT: URI query for nonexistent token");         string memory cid \= events\[ticketEvent\[tokenId\]\].metadataCID;         return string(abi.encodePacked("ipfs://", cid));     }     function setVerifier(address addr, bool status) external onlyOwner {         verifiers\[addr\] \= status;     }     function withdrawFunds() external onlyOwner nonReentrant {         uint256 balance \= address(this).balance;         require(balance \> 0, "TicketNFT: no funds to withdraw");         payable(owner()).transfer(balance);     }     function cancelEvent(uint256 eventId) external onlyOwner {         require(events\[eventId\].isActive, "TicketNFT: already cancelled");         events\[eventId\].isActive \= false;         emit EventCancelled(eventId);     }     function totalEvents() external view returns (uint256) { return \_eventCounter; } } |
| :---: | :---- |

## **6.4  Compiling in Remix**

40. Click the Solidity Compiler icon (S) in the left sidebar.

41. Compiler version: select 0.8.20 — must match your pragma statement.

42. Enable Optimization: check the box, set runs to 200\.

43. Click the blue Compile TicketNFT.sol button.

44. Green checkmark \= success. ABI section appears below the button.

45. If errors appear: read the line number and error message. Solidity errors are very descriptive. Fix and recompile.

| \! | Common error: Ownable constructor changed in OpenZeppelin v5. If you get an error about Ownable(), ensure you write Ownable(msg.sender) in the constructor — not Ownable(). |
| :---: | :---- |

## **6.5  Deploying to Ganache via Remix**

46. Click Deploy & Run Transactions (Ethereum icon).

47. Environment: Injected Provider – MetaMask (connects to Ganache via MetaMask — set up in Phase 5).

48. Account: Account (0) — the organizer. Should show 100 ETH.

49. Contract dropdown: TicketNFT.

50. Click orange Deploy button.

51. MetaMask opens — click Confirm.

52. In Remix terminal at the bottom: green checkmark, transaction hash, and the contract address appear.

53. Under Deployed Contracts at the bottom of the Deploy panel: your contract appears with all its functions as interactive buttons.

54. CRITICAL: Copy the contract address (shown after deployment). You will paste this into your Next.js app.

## **6.6  Testing the Contract Interactively in Remix**

Use the Deployed Contracts section to manually test every function before building the frontend:

| \# | Action | Details |
| ----- | ----- | ----- |
| 1 | createEvent (Account 0\) | Click createEvent. Enter: name='TechFest 2025', maxTickets=50, priceWei=1000000000000000 (0.001 ETH), metadataCID='your\_pinata\_cid'. Click transact. Confirm in MetaMask. |
| 2 | Verify event created | Click getEvent(0) — should return all event fields correctly. |
| 3 | Switch to Account 1 (buyer) | In MetaMask, switch to Account (1). In Remix, account dropdown updates automatically. |
| 4 | purchaseTicket (Account 1\) | Set Value field to 1000000000000000 Wei. Click purchaseTicket(0). Confirm in MetaMask. |
| 5 | Verify ownership | Click ownerOf(0) — should return Account 1's address. |
| 6 | Check tokenURI | Click tokenURI(0) — should return ipfs://your\_cid |
| 7 | Set verifier (Account 0\) | Switch back to Account 0\. Click setVerifier(Account2Address, true). Confirm. |
| 8 | Validate ticket | Click isTicketValid(0, Account1Address) — should return true |
| 9 | Mark used (Account 2\) | Switch MetaMask to Account 2\. Click markUsed(0). Confirm. |
| 10 | Verify used | Click isTicketValid(0, Account1Address) — must now return false. Ticket permanently used. |

# **7\.  Unit Testing in Remix**

## **7.1  Enable Solidity Unit Testing Plugin**

55. In Remix, click the Plugin Manager icon (puzzle piece).

56. Search for: Solidity Unit Testing. Click Activate.

57. A new beaker icon appears in the left sidebar. Click it.

58. Click Generate to create a sample test file in the tests/ folder.

59. Rename it TicketNFT\_test.sol.

## **7.2  Test Cases — All 9 Required Tests**

| \# | Test Name | Input / Action | Expected Result |
| ----- | ----- | ----- | ----- |
| 1 | Event creation | createEvent with valid params | events\[0\].name \== 'TechFest 2025', isActive \== true |
| 2 | Only owner creates event | Non-owner calls createEvent | Transaction reverts with access error |
| 3 | Successful ticket purchase | Buyer sends correct ETH | ownerOf(0) \== buyer, ticketsSold \== 1 |
| 4 | Wrong ETH amount | Buyer sends 0.5x the required ETH | Transaction reverts: 'incorrect ETH amount' |
| 5 | Sold out | Purchase when ticketsSold \== maxTickets | Transaction reverts: 'sold out' |
| 6 | Valid ticket before use | isTicketValid(0, buyer) | Returns true |
| 7 | Invalid after use | markUsed(0) then isTicketValid(0, buyer) | Returns false permanently |
| 8 | Double mark reverts | markUsed(0) called a second time | Reverts: 'ticket already used' |
| 9 | Unauthorized verifier | Non-verifier calls markUsed(0) | Reverts: 'caller is not a verifier' |

## **7.3  Running Tests**

60. In the Solidity Unit Testing panel, click Run.

61. All tests execute against a fresh Remix VM instance.

62. Green checkmarks \= pass. Red X \= fail (click to see error message).

63. Screenshot the all-green result — include this in your project report as evidence.

| ✓ | Pro tip: Run tests against Remix VM (not Ganache) for speed. The test plugin uses Remix VM internally. Once all tests pass on Remix VM, your contract is correct — deploy to Ganache for the actual demo. |
| :---: | :---- |

# **8\.  IPFS Metadata Setup**

## **8.1  What the Metadata JSON Contains**

Each ticket NFT's tokenURI points to a JSON file on IPFS. This is what MetaMask and any NFT viewer displays as the ticket information. Structure your JSON exactly like this:

| metadata.json | {   "name": "TechFest 2025 — General Admission",   "description": "Official entry ticket for TechFest 2025 at City Convention Center.",   "image": "ipfs://YOUR\_TICKET\_IMAGE\_CID/ticket.png",   "attributes": \[     { "trait\_type": "Event",    "value": "TechFest 2025" },     { "trait\_type": "Date",     "value": "2025-12-15" },     { "trait\_type": "Venue",    "value": "City Convention Center" },     { "trait\_type": "Category", "value": "General Admission" },     { "trait\_type": "EventID",  "value": "0" }   \] } |
| :---: | :---- |

## **8.2  Step-by-Step: Upload to Pinata**

64. Go to pinata.cloud. Sign up for a free account (1GB free — more than enough).

65. Design your ticket image — use Canva, Figma, or any image editor. Export as ticket.png.

66. In Pinata: click Upload \> File. Upload ticket.png. Copy the CID (a long hash starting with Qm or bafy).

67. In your metadata.json, replace YOUR\_TICKET\_IMAGE\_CID with the CID from step 3\.

68. In Pinata: click Upload \> File. Upload metadata.json. Copy this second CID.

69. This second CID is your metadataCID — the one you pass to createEvent() in Remix.

70. Test it: open https://gateway.pinata.cloud/ipfs/YOUR\_METADATA\_CID in a browser. You should see the JSON.

| i | Create and upload your ticket image and metadata.json BEFORE deploying your contract. You need the metadataCID ready to pass into createEvent(). Upload order: image first, then metadata.json (because metadata references the image CID). |
| :---: | :---- |

# **9\.  Next.js Frontend — Setup & Implementation**

## **9.1  Create the Next.js Project**

Open a new terminal on Arch Linux (keep Ganache and remixd running in their terminals):

| Terminal 3 | cd \~/nft-ticketing npx create-next-app@latest frontend \--typescript \--tailwind \--app \--src-dir \--import-alias "@/\*" cd frontend |
| :---: | :---- |

When prompted during create-next-app:

* Would you like to use TypeScript? Yes

* Would you like to use ESLint? Yes

* Would you like to use Tailwind CSS? Yes

* Would you like to use src/ directory? Yes

* Would you like to use App Router? Yes

* Would you like to customize the default import alias? No

## **9.2  Install Blockchain Dependencies**

| Terminal 3 | npm install ethers npm install qrcode npm install html5-qrcode npm install @types/qrcode \--save-dev |
| :---: | :---- |

## **9.3  Project Structure**

| File / Folder | Purpose |
| ----- | ----- |
| src/app/page.tsx | Buyer portal — home page showing all events and purchase UI |
| src/app/organizer/page.tsx | Organizer dashboard — create events, view sales, withdraw funds |
| src/app/my-tickets/page.tsx | My Tickets page — shows all NFTs owned by connected wallet with QR codes |
| src/app/verify/page.tsx | Gate Verifier — QR scanner, ownership check, mark ticket used |
| src/lib/contract.ts | Contract address, ABI, and ethers.js connection helpers |
| src/lib/types.ts | TypeScript interfaces for Event, Ticket, etc. |
| src/components/ConnectWallet.tsx | Reusable MetaMask connect button component |
| src/components/EventCard.tsx | Card component displaying one event with Buy Ticket button |
| src/components/TicketCard.tsx | Card component showing owned ticket NFT with QR code |
| src/components/QRScanner.tsx | Camera QR scanner component for the verifier page |

## **9.4  contract.ts — The Central Config File**

After deploying your contract in Remix, copy the contract address and ABI into this file. Every page imports from here:

| src/lib/contract.ts | import { ethers } from 'ethers'; // Paste your deployed contract address from Remix here export const CONTRACT\_ADDRESS \= '0xYourDeployedAddressHere'; // Paste the ABI from Remix Compiler tab here export const CONTRACT\_ABI \= \[ /\* ... paste ABI array here ... \*/ \]; // Helper: get a read-only contract instance (no signer) export async function getReadContract() {   const provider \= new ethers.JsonRpcProvider('http://127.0.0.1:8545');   return new ethers.Contract(CONTRACT\_ADDRESS, CONTRACT\_ABI, provider); } // Helper: get a write contract instance (requires MetaMask signer) export async function getWriteContract() {   if (\!window.ethereum) throw new Error('MetaMask not found');   const provider \= new ethers.BrowserProvider(window.ethereum);   const signer \= await provider.getSigner();   return new ethers.Contract(CONTRACT\_ADDRESS, CONTRACT\_ABI, signer); } |
| :---: | :---- |

| \! | Every time you redeploy the contract in Remix (e.g., after changing the Solidity code), you must copy the NEW contract address and NEW ABI into contract.ts. The old address becomes stale. |
| :---: | :---- |

## **9.5  ConnectWallet.tsx Component**

| src/components/ConnectWallet.tsx | 'use client'; import { useState } from 'react'; import { ethers } from 'ethers'; export default function ConnectWallet() {   const \[address, setAddress\] \= useState\<string\>('');   async function connect() {     if (\!window.ethereum) { alert('Install MetaMask first'); return; }     const provider \= new ethers.BrowserProvider(window.ethereum);     const signer \= await provider.getSigner();     setAddress(await signer.getAddress());   }   return (     \<div className="flex items-center gap-4"\>       {address ? (         \<span className="text-sm font-mono bg-gray-100 px-3 py-1 rounded"\>           {address.slice(0,6)}...{address.slice(-4)}         \</span\>       ) : (         \<button onClick={connect}           className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"\>           Connect Wallet         \</button\>       )}     \</div\>   ); } |
| :---: | :---- |

## **9.6  Core Ethers.js Patterns — Study These**

Every blockchain interaction in your app uses one of four patterns:

### **Pattern 1 — Read Event Data (no wallet needed)**

| TypeScript | const contract \= await getReadContract(); const totalEvents \= await contract.totalEvents(); const eventData \= await contract.getEvent(0); console.log(eventData.name, eventData.priceWei.toString()); |
| :---: | :---- |

### **Pattern 2 — Purchase a Ticket (write \+ ETH)**

| TypeScript | const contract \= await getWriteContract(); const priceWei \= eventData.priceWei; const tx \= await contract.purchaseTicket(eventId, { value: priceWei }); const receipt \= await tx.wait();   // wait for block confirmation console.log('Mined in block:', receipt.blockNumber); |
| :---: | :---- |

### **Pattern 3 — Check Ownership (verify page)**

| TypeScript | const contract \= await getReadContract(); const owner \= await contract.ownerOf(tokenId); const isUsed \= await contract.usedTickets(tokenId); const isValid \= owner.toLowerCase() \=== walletAddress.toLowerCase() && \!isUsed; |
| :---: | :---- |

### **Pattern 4 — Mark Ticket Used (verifier action)**

| TypeScript | const contract \= await getWriteContract();   // verifier's MetaMask account const tx \= await contract.markUsed(tokenId); await tx.wait(); alert('Ticket marked as used on-chain permanently'); |
| :---: | :---- |

## **9.7  Page-by-Page Feature Summary**

| Page | Key UI Elements | Contract Calls |
| ----- | ----- | ----- |
| / (Buyer Home) | ConnectWallet, event grid cards, Buy Ticket button, transaction status toast | totalEvents(), getEvent(id), purchaseTicket(id){value} |
| /my-tickets | Grid of owned NFTs, each showing event name, date, and QR code | balanceOf(wallet), tokenOfOwnerByIndex(wallet,i), tokenURI(id) |
| /organizer | Create Event form, events table with sales stats, Withdraw and Cancel buttons | createEvent(), totalEvents(), getEvent(), withdrawFunds(), cancelEvent() |
| /verify | QR camera scanner, decoded address+tokenId, green/red verification badge, Mark Entry button | ownerOf(tokenId), usedTickets(tokenId), markUsed(tokenId), setVerifier(addr,true) |

## **9.8  QR Code Generation (My Tickets Page)**

Each ticket QR encodes both the wallet address and token ID, separated by a colon. The verifier page decodes this to run the ownership check:

| TypeScript | import QRCode from 'qrcode'; // Generate QR code as data URL const qrData \= \`${walletAddress}:${tokenId}\`; const qrDataUrl \= await QRCode.toDataURL(qrData, { width: 200 }); // Render in JSX // \<img src={qrDataUrl} alt="Ticket QR" className="w-48 h-48" /\> |
| :---: | :---- |

## **9.9  QR Code Scanner (Verify Page)**

| TypeScript | 'use client'; import { Html5QrcodeScanner } from 'html5-qrcode'; import { useEffect, useRef } from 'react'; export default function QRScanner({ onScan }: { onScan: (data: string) \=\> void }) {   const scannerRef \= useRef\<Html5QrcodeScanner | null\>(null);   useEffect(() \=\> {     scannerRef.current \= new Html5QrcodeScanner(       'qr-reader', { fps: 10, qrbox: 250 }, false     );     scannerRef.current.render(       (decodedText) \=\> onScan(decodedText),       (error) \=\> console.warn(error)     );     return () \=\> { scannerRef.current?.clear(); };   }, \[\]);   return \<div id="qr-reader" className="w-full max-w-sm" /\>; } |
| :---: | :---- |

## **9.10  Running the Frontend**

| Terminal 3 | cd \~/nft-ticketing/frontend npm run dev |
| :---: | :---- |

Open http://localhost:3000 in your browser. MetaMask should detect the page and be ready to connect. Ensure Ganache is still running in Terminal 1\.

# **10\.  4-Week Project Timeline**

| Week | Days | Focus | Deliverables |
| ----- | ----- | ----- | ----- |
| Week 1 | Day 1 | Full Environment Setup | pacman installs, Ganache-CLI verified, MetaMask configured with Ganache network, 3 accounts imported |
| Week 1 | Day 2 | Ganache \+ Remix Link | Ganache running, remixd running, Remix connected via Injected Provider. Test deploy of a blank contract to confirm the link. |
| Week 1 | Day 3–5 | Write TicketNFT.sol | All 6 sections (A–F) written. Compile to 0 errors. Screenshot green compile. |
| Week 1 | Day 6–7 | Deploy & Manual Test | Deploy to Ganache. Complete all 10 interactive tests in Remix (Section 6.6). Screenshot each step. |
| Week 2 | Day 8–9 | Unit Tests in Remix | All 9 unit tests written. All pass. Screenshot of green test results. |
| Week 2 | Day 10 | IPFS Metadata | Ticket image designed. metadata.json created. Both uploaded to Pinata. CIDs recorded. tokenURI verified in Remix. |
| Week 2 | Day 11 | Next.js Setup | create-next-app complete. ethers, qrcode, html5-qrcode installed. contract.ts configured with address \+ ABI. |
| Week 2–3 | Day 12–15 | Frontend: Home \+ Organizer Pages | Event list loads from blockchain. Buy Ticket sends transaction. Organizer form creates events. |
| Week 3 | Day 16–18 | Frontend: My Tickets Page | Owned NFTs load. QR codes generated correctly. tokenURI metadata fetched and displayed. |
| Week 3–4 | Day 19–22 | Frontend: Verify Page | QR scanner working. isTicketValid check. Green/red UI. Mark Used transaction. Double-entry rejected. |
| Week 4 | Day 23–25 | End-to-End Integration Test | Full flow: create event → buy ticket → view QR → scan → verify → mark used → re-scan rejected. |
| Week 4 | Day 26–28 | Report \+ Demo Prep | Project report written. Slides prepared. Screen recording done. Demo script rehearsed twice. |

# **11\.  Deliverables & Evaluation Checklist**

| \# | Deliverable | Evidence |
| ----- | ----- | ----- |
| 1 | TicketNFT.sol source code with all functions | Open in Remix, walk evaluator through each section |
| 2 | Ganache-CLI running, connected to Remix | Live terminal showing Ganache output and incoming transactions |
| 3 | Contract compiles without errors or warnings | Screenshot: green checkmark in Remix Solidity Compiler |
| 4 | All 9 unit tests pass | Screenshot: Remix Solidity Unit Testing — all green |
| 5 | Contract deployed to Ganache, address noted | Remix terminal showing deployment tx hash and contract address |
| 6 | IPFS metadata working | Click tokenURI in Remix — browser opens JSON on Pinata gateway |
| 7 | Next.js frontend running on localhost:3000 | Live demo: connect wallet, see events loaded from blockchain |
| 8 | Ticket purchase flow | Demo: buy ticket, MetaMask confirmation, NFT appears in My Tickets with QR |
| 9 | Gate verification flow | Demo: scan QR, green pass, mark used, scan again gets red fail |
| 10 | Project report | This document \+ architecture diagram \+ screenshots of all 10 steps |

## **11.1  Bonus Features for Higher Grades**

* TicketMarket.sol: secondary resale with price cap and organizer royalty percentage (e.g., 10% of resale price goes back to organizer).

* Transfer block after event: override \_beforeTokenTransfer() to revert if block.timestamp \> eventEndTime.

* Event cancellation with auto-refund: refundTicket() burns the NFT and returns ETH to the buyer.

* Deploy to Sepolia public testnet: set up Alchemy/Infura RPC, get Sepolia test ETH from faucet, deploy from Remix to real testnet.

* Seat-specific tickets: purchaseTicket(eventId, seatNumber) — each token stores its seat in the struct.

# **12\.  Troubleshooting — Arch Linux \+ Ganache \+ Remix**

| Problem | Cause | Fix |
| ----- | ----- | ----- |
| Ganache: address already in use | Port 8545 is occupied by another process | Run: lsof \-i :8545 to find the PID, then: kill PID. Or use \--port 8546 in Ganache and update MetaMask RPC URL. |
| MetaMask: wrong network error | MetaMask is on mainnet, not Ganache Local | Click network dropdown in MetaMask \> select Ganache Local (127.0.0.1:8545, chainId 1337\) |
| MetaMask: nonce too high | MetaMask cached old nonces from a previous Ganache session | MetaMask \> Account \> Settings \> Advanced \> Clear Activity / Reset Account |
| Remix: No accounts found | Remix not connected to MetaMask or Ganache not running | Ensure Ganache is running. In Remix Environment: select Injected Provider – MetaMask. Reconnect MetaMask. |
| remixd: ENOENT error | Path given to remixd does not exist | Double-check: remixd \-s \~/nft-ticketing/contracts — ensure that directory exists (mkdir \-p) |
| Compile error: Ownable constructor | OpenZeppelin v5 changed Ownable() signature | Change constructor to: constructor() ERC721('TicketNFT','TNFT') Ownable(msg.sender) {} |
| Compile error: \_exists not found | \_exists() removed in OpenZeppelin ERC721 v5 | Replace \_exists(tokenId) with: tokenId \< \_tokenCounter (your manual existence check) |
| purchaseTicket reverts | Wrong Wei value sent | In Remix Value field: type exact Wei amount and select Wei from dropdown. Do NOT select ETH. |
| Next.js: window is not defined | Ethers.js / window.ethereum called during SSR | Add 'use client' at the top of any component that uses ethers or window.ethereum |
| Next.js: ethers import error | Next.js App Router \+ ethers.js ESM conflict | In next.config.js add: experimental: { esmExternals: 'loose' } OR use: import { ethers } from 'ethers/lib' |
| QR scanner: camera not opening | Browser blocking camera on localhost | In Chromium-based browsers: allow camera permissions for localhost in browser settings |
| html5-qrcode SSR error | html5-qrcode uses browser APIs, breaks on server | Wrap the QRScanner component with dynamic import: dynamic(() \=\> import('@/components/QRScanner'), { ssr: false }) |
| Ganache data lost on restart | \--deterministic flag not used | Always start Ganache with: ganache \--port 8545 \--chain.chainId 1337 \--deterministic to get same accounts |

# **13\.  Resources & Quick Reference**

## **13.1  Learning Resources — Priority Order**

| P | Resource | What to Study |
| ----- | ----- | ----- |
| 1 | solidity-by-example.org | Study in order: Variables, Mapping, Struct, Events, Modifier, Constructor, Payable, Sending Ether, Call, Interface |
| 2 | cryptozombies.io (Lessons 1–4) | Gamified Solidity \+ ERC-721 course. Covers exactly what this project needs. |
| 3 | docs.openzeppelin.com/contracts/5.x | ERC721 section. Read the Preset contracts page for the exact import pattern. |
| 4 | eips.ethereum.org/EIPS/eip-721 | The actual ERC-721 standard — 2 pages. Read it once to understand the 9 mandatory functions. |
| 5 | docs.ethers.org/v6 | Ethers.js v6 docs. Focus: BrowserProvider, JsonRpcProvider, Signer, Contract class, parseEther. |
| 6 | remix.ethereum.org (built-in tutorials) | Run the built-in Storage and Ballot tutorials on Day 1 to learn the IDE itself. |
| 7 | nextjs.org/docs/app | Next.js App Router docs. Focus: Client Components ('use client'), data fetching, routing. |
| 8 | docs.pinata.cloud | How to upload files and retrieve CIDs. 5-minute read. |

## **13.2  Terminal Quick Reference**

| Command | What It Does |
| ----- | ----- |
| ganache \--port 8545 \--chain.chainId 1337 \--deterministic | Start Ganache local blockchain (keep running in Terminal 1\) |
| remixd \-s \~/nft-ticketing/contracts \--remix-ide https://remix.ethereum.org | Start remixd file bridge (keep running in Terminal 2\) |
| cd \~/nft-ticketing/frontend && npm run dev | Start Next.js frontend at localhost:3000 (Terminal 3\) |
| lsof \-i :8545 | Check if port 8545 is already occupied |
| kill $(lsof \-t \-i :8545) | Kill whatever is using port 8545 |
| npm run build (in frontend/) | Build Next.js for production — run before final demo |
| ganache \--help | Full list of Ganache-CLI flags and options |

## **13.3  Three-Terminal Workflow (Always Keep These Open)**

| Terminal | Process | Command |
| ----- | ----- | ----- |
| Terminal 1 | Ganache-CLI (blockchain) | ganache \--port 8545 \--chain.chainId 1337 \--deterministic |
| Terminal 2 | remixd (file bridge) | remixd \-s \~/nft-ticketing/contracts \--remix-ide https://remix.ethereum.org |
| Terminal 3 | Next.js dev server | cd \~/nft-ticketing/frontend && npm run dev |
| Browser | Remix IDE | remix.ethereum.org (connected via MetaMask to Ganache) |
| Browser | Next.js App | localhost:3000 |

# **14\.  Presentation Demo Script**

Practice this 5-minute script twice before your evaluation. Have all three terminals running and both browser tabs open before you start.

| Time | Action | What to Say |
| ----- | ----- | ----- |
| 0:00 | Show Terminal 1 | 'Ganache-CLI is running here — our local Ethereum blockchain on port 8545\. Ten test accounts, each with 100 ETH. No real money involved.' |
| 0:30 | Show Remix \+ TicketNFT.sol | 'This is the smart contract written in Solidity. It inherits OpenZeppelin's ERC-721 standard. The Event struct stores all event data. purchaseTicket() mints a unique NFT to the buyer.' |
| 1:00 | Show test results | 'Nine unit tests — covering purchase, verification, double-entry prevention, and access control. All green.' |
| 1:30 | Deploy contract | 'Deploying to Ganache via MetaMask — Account 0 is the organizer. Now I call createEvent() with our event details and Pinata IPFS CID.' |
| 2:00 | Purchase ticket | 'Switching to Account 1 — the buyer. Calling purchaseTicket() with 0.001 ETH. MetaMask confirms. Ganache mines the block.' |
| 2:30 | Show Next.js home | 'This is our Next.js frontend. The event loaded directly from the blockchain. The buyer clicks Buy Ticket — same transaction you just saw.' |
| 3:00 | Show My Tickets | 'After purchase the NFT appears here. tokenURI fetches the metadata from IPFS — event name, date, venue. The QR code is generated from the wallet address and token ID.' |
| 3:30 | Verify flow | 'On the verify page, I scan the QR. The app calls ownerOf() and isTicketValid() on-chain. Green — valid ticket. I click Mark Entry.' |
| 4:00 | Scan again | 'Same QR scanned again. Now the app reads usedTickets\[0\]==true from the blockchain. Red — entry denied. This is permanent — no admin can reset it.' |
| 4:30 | Conclude | 'The blockchain replaces the central database entirely. Ownership is cryptographically provable. The used-flag is immutable. No screenshot, PDF, or forgery can pass this system.' |

| ★ | Record this demo as a screen recording the day before your presentation. If MetaMask or any tool glitches during the live demo, play the recording. Evaluators respect preparation over live troubleshooting. |
| :---: | :---- |

**End of Project Plan — Arch Linux Complete Methodology Edition**

NFT-Based Secure Ticketing & Verification Platform  |  Ganache-CLI \+ Remix \+ Next.js  |  VI Semester