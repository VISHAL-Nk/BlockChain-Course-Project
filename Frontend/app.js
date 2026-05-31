// ============================================
// TicketNFT — Frontend Application
// ============================================

// ---------- Global State ----------
let provider = null;
let signer = null;
let contract = null;
let currentAccount = null;
let isOwner = false;
let isVerifier = false;

// Cached data
let allTokenIds = [];    // All token IDs from Transfer events
let totalEventsCount = 0;

// ============================================
// WALLET MANAGEMENT
// ============================================

/**
 * Connect to MetaMask wallet, create provider/signer/contract instances.
 */
async function connectWallet() {
  try {
    // Check if MetaMask is available
    if (typeof window.ethereum === 'undefined') {
      showToast('MetaMask is not installed. Please install it to continue.', 'error');
      return;
    }

    // Request accounts
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    if (!accounts || accounts.length === 0) {
      showToast('No accounts found. Please unlock MetaMask.', 'error');
      return;
    }

    currentAccount = accounts[0];

    // Create ethers provider and signer
    provider = new ethers.BrowserProvider(window.ethereum);
    signer = await provider.getSigner();

    // Create contract instance
    contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

    // Update UI
    await updateWalletUI();

    // Check if user is the contract owner
    await checkOwnerStatus();
    await checkVerifierStatus();

    // Show main content, hide connect prompt
    document.getElementById('connect-prompt').style.display = 'none';
    switchTab('browse-events');

    // Load initial data
    await loadAllData();

    showToast('Wallet connected successfully!', 'success');
  } catch (err) {
    console.error('Connect wallet error:', err);
    showToast('Failed to connect wallet: ' + (err.message || err), 'error');
  }
}

/**
 * Disconnect wallet and reset all state.
 */
function disconnectWallet() {
  provider = null;
  signer = null;
  contract = null;
  currentAccount = null;
  isOwner = false;
  isVerifier = false;
  allTokenIds = [];
  totalEventsCount = 0;

  // Reset UI
  document.getElementById('wallet-info').style.display = 'none';
  document.getElementById('btn-connect').style.display = '';
  document.getElementById('btn-disconnect').style.display = 'none';
  document.getElementById('tab-organizer').style.display = 'none';
  document.getElementById('connect-prompt').style.display = '';

  // Hide all sections
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));

  // Reset nav tabs
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.querySelector('[data-section="browse-events"]').classList.add('active');

  showToast('Wallet disconnected.', 'info');
}

/**
 * Update wallet info display (address + balance).
 */
async function updateWalletUI() {
  const addrEl = document.getElementById('wallet-address');
  const balEl = document.getElementById('wallet-balance');

  addrEl.textContent = truncateAddress(currentAccount);

  const balance = await provider.getBalance(currentAccount);
  balEl.textContent = parseFloat(ethers.formatEther(balance)).toFixed(4) + ' ETH';

  document.getElementById('wallet-info').style.display = 'flex';
  document.getElementById('btn-connect').style.display = 'none';
  document.getElementById('btn-disconnect').style.display = '';
}

/**
 * Check if the connected wallet is the contract owner.
 */
async function checkOwnerStatus() {
  try {
    const owner = await contract.owner();
    isOwner = owner.toLowerCase() === currentAccount.toLowerCase();
    document.getElementById('tab-organizer').style.display = isOwner ? '' : 'none';
  } catch (err) {
    console.error('Error checking owner status:', err);
    isOwner = false;
  }
}

/**
 * Check if the connected wallet is a gate verifier.
 */
async function checkVerifierStatus() {
  try {
    isVerifier = await contract.verifiers(currentAccount);
    
    // Toggle scanner UI
    const scannerCard = document.getElementById('qr-scanner-card');
    const notVerifierMsg = document.getElementById('not-verifier-msg');
    
    if (scannerCard && notVerifierMsg) {
      if (isVerifier) {
        scannerCard.style.display = 'block';
        notVerifierMsg.style.display = 'none';
      } else {
        scannerCard.style.display = 'none';
        notVerifierMsg.style.display = 'block';
      }
    }
  } catch (err) {
    console.error('Error checking verifier status:', err);
    isVerifier = false;
  }
}

// Listen for account/chain changes
if (typeof window.ethereum !== 'undefined') {
  window.ethereum.on('accountsChanged', async (accounts) => {
    if (accounts.length === 0) {
      disconnectWallet();
    } else {
      currentAccount = accounts[0];
      signer = await provider.getSigner();
      contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      await updateWalletUI();
      await checkOwnerStatus();
      await checkVerifierStatus();
      await loadAllData();
      showToast('Account changed to ' + truncateAddress(currentAccount), 'info');
    }
  });

  window.ethereum.on('chainChanged', () => {
    window.location.reload();
  });
}

// ============================================
// TAB NAVIGATION
// ============================================

/**
 * Switch active tab and section.
 * @param {string} sectionId - The section ID (without 'section-' prefix).
 */
function switchTab(sectionId) {
  // Update tabs
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.section === sectionId);
  });

  // Update sections
  document.querySelectorAll('.section').forEach(section => {
    section.classList.toggle('active', section.id === 'section-' + sectionId);
  });

  // Lazy-load data for the section
  if (contract) {
    switch (sectionId) {
      case 'browse-events': loadEvents(); break;
      case 'my-tickets': loadMyTickets(); break;
      case 'resale-market': loadResaleTickets(); break;
      case 'organizer': loadEvents(); break;
    }
  }
}

// ============================================
// LOAD ALL DATA
// ============================================

/**
 * Load all data after wallet connection.
 */
async function loadAllData() {
  await collectAllTokenIds();
  await loadEvents();
  await loadMyTickets();
  await loadResaleTickets();
}

/**
 * Collect all token IDs from Transfer events for later use.
 */
async function collectAllTokenIds() {
  try {
    const transferFilter = contract.filters.Transfer(null, null);
    const events = await contract.queryFilter(transferFilter);

    const tokenIdSet = new Set();
    events.forEach(ev => {
      tokenIdSet.add(ev.args[2].toString());
    });
    allTokenIds = Array.from(tokenIdSet);
  } catch (err) {
    console.error('Error collecting token IDs:', err);
    allTokenIds = [];
  }
}

// ============================================
// BROWSE EVENTS
// ============================================

/**
 * Load and display all events from the contract.
 */
async function loadEvents() {
  const grid = document.getElementById('events-grid');
  const emptyState = document.getElementById('events-empty');

  try {
    totalEventsCount = Number(await contract.totalEvents());

    if (totalEventsCount === 0) {
      grid.innerHTML = '';
      grid.appendChild(createEmptyState('🎵', 'No events available', 'Check back later for new events.'));
      updateOrganizerEventsList([]);
      return;
    }

    const eventsData = [];
    for (let i = 0; i < totalEventsCount; i++) {
      const ev = await contract.events(i);
      eventsData.push({
        id: i,
        name: ev.name,
        maxTickets: Number(ev.maxTickets),
        ticketsSold: Number(ev.ticketsSold),
        priceWei: ev.priceWei,
        isActive: ev.isActive,
        metadataCID: ev.metadataCID
      });
    }

    // Render event cards
    grid.innerHTML = '';
    eventsData.forEach(ev => {
      grid.appendChild(createEventCard(ev));
    });

    // Also update organizer events list if owner
    if (isOwner) {
      updateOrganizerEventsList(eventsData);
    }
  } catch (err) {
    console.error('Error loading events:', err);
    grid.innerHTML = '';
    grid.appendChild(createEmptyState('⚠️', 'Failed to load events', err.message));
  }
}

/**
 * Create an event card element.
 */
function createEventCard(ev) {
  const card = document.createElement('div');
  card.className = 'card';

  const isSoldOut = ev.ticketsSold >= ev.maxTickets;
  let badgeClass = 'badge-active';
  let badgeText = 'Active';
  if (!ev.isActive) {
    badgeClass = 'badge-cancelled';
    badgeText = 'Cancelled';
  } else if (isSoldOut) {
    badgeClass = 'badge-sold-out';
    badgeText = 'Sold Out';
  }

  const priceEth = ethers.formatEther(ev.priceWei);
  const soldPercent = ev.maxTickets > 0 ? Math.round((ev.ticketsSold / ev.maxTickets) * 100) : 0;

  card.innerHTML = `
    <div class="card-header">
      <div class="card-title">${escapeHtml(ev.name)}</div>
      <span class="badge ${badgeClass}">${badgeText}</span>
    </div>
    <div class="card-price">${priceEth} ETH</div>
    <div class="card-detail">
      <span class="card-detail-label">Tickets</span>
      <span>${ev.ticketsSold} / ${ev.maxTickets} sold</span>
    </div>
    <div class="progress-bar-wrapper">
      <div class="progress-bar" style="width: ${soldPercent}%"></div>
    </div>
    <div class="card-actions">
      <button class="btn btn-primary" 
        onclick="purchaseTicket(${ev.id})" 
        ${(!ev.isActive || isSoldOut) ? 'disabled' : ''}>
        🎫 Buy Ticket
      </button>
    </div>
  `;
  return card;
}

/**
 * Purchase a ticket for a given event.
 */
async function purchaseTicket(eventId) {
  try {
    const ev = await contract.events(eventId);
    showToast('Purchasing ticket...', 'info');

    const tx = await contract.purchaseTicket(eventId, { value: ev.priceWei });
    showToast('Transaction submitted. Waiting for confirmation...', 'info');

    await tx.wait();
    showToast('Ticket purchased successfully! 🎉', 'success');

    // Refresh data
    await collectAllTokenIds();
    await loadEvents();
    await loadMyTickets();
  } catch (err) {
    console.error('Purchase error:', err);
    showToast('Purchase failed: ' + parseError(err), 'error');
  }
}

// ============================================
// MY TICKETS
// ============================================

/**
 * Load tickets owned by the connected wallet.
 */
async function loadMyTickets() {
  const grid = document.getElementById('tickets-grid');

  try {
    const myTickets = [];

    for (const tokenId of allTokenIds) {
      try {
        const owner = await contract.ownerOf(tokenId);
        if (owner.toLowerCase() === currentAccount.toLowerCase()) {
          const eventId = Number(await contract.ticketEvent(tokenId));
          const ev = await contract.events(eventId);
          const isUsed = await contract.usedTickets(tokenId);
          const resalePrice = await contract.ticketResalePrice(tokenId);

          let tokenUri = '';
          try {
            tokenUri = await contract.tokenURI(tokenId);
          } catch (_) { /* tokenURI may fail */ }

          myTickets.push({
            tokenId,
            eventId,
            eventName: ev.name,
            isUsed,
            resalePrice,
            tokenUri
          });
        }
      } catch (_) {
        // Token may not exist or ownerOf reverts
      }
    }

    grid.innerHTML = '';
    if (myTickets.length === 0) {
      grid.appendChild(createEmptyState('🎟️', 'No tickets yet', 'Purchase a ticket from the Browse Events tab.'));
      return;
    }

    myTickets.forEach(ticket => {
      grid.appendChild(createTicketCard(ticket));
    });
  } catch (err) {
    console.error('Error loading tickets:', err);
    grid.innerHTML = '';
    grid.appendChild(createEmptyState('⚠️', 'Failed to load tickets', err.message));
  }
}

/**
 * Create a ticket card element.
 */
function createTicketCard(ticket) {
  const card = document.createElement('div');
  card.className = 'card';

  let badgeClass, badgeText;
  if (ticket.isUsed) {
    badgeClass = 'badge-used';
    badgeText = 'Used';
  } else if (ticket.resalePrice > 0n) {
    badgeClass = 'badge-for-sale';
    badgeText = 'For Sale';
  } else {
    badgeClass = 'badge-valid';
    badgeText = 'Valid';
  }

  const resalePriceStr = ticket.resalePrice > 0n
    ? ethers.formatEther(ticket.resalePrice) + ' ETH'
    : '';

  card.innerHTML = `
    <div class="card-header">
      <div>
        <div class="card-title">Token #${ticket.tokenId}</div>
        <div class="card-detail" style="margin-top: 4px;">${escapeHtml(ticket.eventName)}</div>
      </div>
      <span class="badge ${badgeClass}">${badgeText}</span>
    </div>
    ${ticket.tokenUri ? `<a href="${escapeHtml(ticket.tokenUri)}" target="_blank" class="link">View Metadata</a>` : ''}
    <div class="card-actions">
      <button class="btn btn-outline btn-sm" onclick="showQRCode('${ticket.tokenId}')">🔲 Show QR</button>
      ${!ticket.isUsed ? `
        <button class="btn btn-primary btn-sm" onclick="showResaleForm('${ticket.tokenId}', this)">🏷️ List for Resale</button>
      ` : ''}
    </div>
    <div class="resale-form" id="resale-form-${ticket.tokenId}" style="display: none;">
      <input class="form-input" type="text" id="resale-price-${ticket.tokenId}" placeholder="Price (ETH)">
      <button class="btn btn-success btn-sm" onclick="listForResale('${ticket.tokenId}')">List</button>
      <button class="btn btn-outline btn-sm" onclick="document.getElementById('resale-form-${ticket.tokenId}').style.display='none'">Cancel</button>
    </div>
  `;
  return card;
}

/**
 * Show the inline resale form for a ticket.
 */
function showResaleForm(tokenId, btn) {
  document.getElementById(`resale-form-${tokenId}`).style.display = 'flex';
}

/**
 * List a ticket for resale at a given price.
 */
async function listForResale(tokenId) {
  try {
    const priceInput = document.getElementById(`resale-price-${tokenId}`);
    const priceEth = priceInput.value.trim();
    if (!priceEth || isNaN(priceEth) || parseFloat(priceEth) <= 0) {
      showToast('Please enter a valid price.', 'error');
      return;
    }

    const priceWei = ethers.parseEther(priceEth);
    showToast('Listing ticket for resale...', 'info');

    const tx = await contract.listTicketForSale(tokenId, priceWei);
    await tx.wait();

    showToast('Ticket listed for resale! 🏷️', 'success');
    await loadMyTickets();
    await loadResaleTickets();
  } catch (err) {
    console.error('Resale listing error:', err);
    showToast('Failed to list ticket: ' + parseError(err), 'error');
  }
}

/**
 * Show QR code for a ticket.
 */
async function showQRCode(tokenId) {
  try {
    showToast('Generating QR code...', 'info');

    const response = await fetch('/api/generate-qr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: JSON.stringify({
          tokenId: tokenId,
          wallet: currentAccount,
          contractAddress: CONTRACT_ADDRESS
        })
      })
    });

    if (!response.ok) {
      throw new Error('Server returned ' + response.status);
    }

    const data = await response.json();

    if (data.qrBase64) {
      showModal('QR Code — Token #' + tokenId, `<img src="${data.qrBase64}" alt="QR Code for Token ${tokenId}">`);
    } else {
      throw new Error('No QR code data received.');
    }
  } catch (err) {
    console.error('QR code error:', err);
    // Fallback: show a text-based QR placeholder
    const qrData = JSON.stringify({ tokenId, wallet: currentAccount, contract: CONTRACT_ADDRESS });
    showModal(
      'Ticket Info — Token #' + tokenId,
      `<div style="padding: 20px; background: #f8fafc; border-radius: 8px; word-break: break-all; font-size: 0.85rem; text-align: left;">
        <p><strong>Token ID:</strong> ${tokenId}</p>
        <p><strong>Wallet:</strong> ${currentAccount}</p>
        <p><strong>Contract:</strong> ${CONTRACT_ADDRESS}</p>
        <p style="margin-top: 12px; color: var(--color-text-secondary); font-size: 0.8rem;">⚠️ QR server unavailable. Share this info manually.</p>
      </div>`
    );
  }
}

// ============================================
// RESALE MARKETPLACE
// ============================================

/**
 * Load tickets that are listed for resale.
 */
async function loadResaleTickets() {
  const grid = document.getElementById('resale-grid');

  try {
    const resaleTickets = [];

    for (const tokenId of allTokenIds) {
      try {
        const resalePrice = await contract.ticketResalePrice(tokenId);
        if (resalePrice > 0n) {
          const owner = await contract.ownerOf(tokenId);
          const eventId = Number(await contract.ticketEvent(tokenId));
          const ev = await contract.events(eventId);

          resaleTickets.push({
            tokenId,
            eventName: ev.name,
            originalPrice: ev.priceWei,
            resalePrice,
            seller: owner
          });
        }
      } catch (_) {
        // Skip tokens that error
      }
    }

    grid.innerHTML = '';
    if (resaleTickets.length === 0) {
      grid.appendChild(createEmptyState('🏷️', 'No resale tickets', 'No tickets are currently listed for resale.'));
      return;
    }

    resaleTickets.forEach(ticket => {
      grid.appendChild(createResaleCard(ticket));
    });
  } catch (err) {
    console.error('Error loading resale tickets:', err);
    grid.innerHTML = '';
    grid.appendChild(createEmptyState('⚠️', 'Failed to load resale tickets', err.message));
  }
}

/**
 * Create a resale ticket card element.
 */
function createResaleCard(ticket) {
  const card = document.createElement('div');
  card.className = 'card';

  const resaleEth = ethers.formatEther(ticket.resalePrice);
  const originalEth = ethers.formatEther(ticket.originalPrice);
  const isSelf = ticket.seller.toLowerCase() === currentAccount.toLowerCase();

  card.innerHTML = `
    <div class="card-header">
      <div>
        <div class="card-title">Token #${ticket.tokenId}</div>
        <div class="card-detail" style="margin-top: 4px;">${escapeHtml(ticket.eventName)}</div>
      </div>
      <span class="badge badge-for-sale">For Sale</span>
    </div>
    <div class="card-price">${resaleEth} ETH</div>
    <div class="card-detail">
      <span class="card-detail-label">Original:</span>
      <span>${originalEth} ETH</span>
    </div>
    <div class="card-detail">
      <span class="card-detail-label">Seller:</span>
      <span>${truncateAddress(ticket.seller)}</span>
    </div>
    <div class="card-actions">
      <button class="btn btn-primary" 
        onclick="buyResaleTicket('${ticket.tokenId}', '${ticket.resalePrice}')" 
        ${isSelf ? 'disabled title="This is your ticket"' : ''}>
        ${isSelf ? 'Your Listing' : 'Buy Ticket'}
      </button>
    </div>
  `;
  return card;
}

/**
 * Buy a resale ticket.
 */
async function buyResaleTicket(tokenId, resalePrice) {
  try {
    showToast('Purchasing resale ticket...', 'info');

    const tx = await contract.buyResaleTicket(tokenId, { value: resalePrice });
    showToast('Transaction submitted. Waiting for confirmation...', 'info');

    await tx.wait();
    showToast('Resale ticket purchased! 🎉', 'success');

    // Refresh data
    await collectAllTokenIds();
    await loadMyTickets();
    await loadResaleTickets();
  } catch (err) {
    console.error('Resale purchase error:', err);
    showToast('Purchase failed: ' + parseError(err), 'error');
  }
}

// ============================================
// ORGANIZER DASHBOARD
// ============================================

/**
 * Handle the Create Event form submission.
 */
async function handleCreateEvent(e) {
  e.preventDefault();

  const name = document.getElementById('event-name').value.trim();
  const date = document.getElementById('event-date').value;
  const venue = document.getElementById('event-venue').value.trim();
  const category = document.getElementById('event-category').value.trim();
  const maxTickets = parseInt(document.getElementById('event-max-tickets').value);
  const priceEth = document.getElementById('event-price').value.trim();

  if (!name || !date || !venue || !category || !maxTickets || !priceEth) {
    showToast('Please fill in all fields.', 'error');
    return;
  }

  const priceWei = ethers.parseEther(priceEth);

  try {
    // Build metadata JSON
    const metadata = {
      name,
      description: `${name} — ${category} event at ${venue} on ${date}`,
      attributes: [
        { trait_type: 'Date', value: date },
        { trait_type: 'Venue', value: venue },
        { trait_type: 'Category', value: category },
        { trait_type: 'Max Tickets', value: maxTickets.toString() },
        { trait_type: 'Price (ETH)', value: priceEth }
      ]
    };

    showToast('Uploading metadata to IPFS...', 'info');

    let metadataCID = '';
    try {
      const ipfsResponse = await fetch('/api/upload-to-ipfs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metadata)
      });

      if (ipfsResponse.ok) {
        const ipfsData = await ipfsResponse.json();
        metadataCID = ipfsData.cid || '';
      }
    } catch (ipfsErr) {
      console.warn('IPFS upload failed, using empty CID:', ipfsErr);
      showToast('IPFS upload failed. Creating event without metadata CID.', 'info');
    }

    showToast('Creating event on blockchain...', 'info');

    const tx = await contract.createEvent(name, maxTickets, priceWei, metadataCID);
    showToast('Transaction submitted. Waiting for confirmation...', 'info');

    await tx.wait();
    showToast('Event created successfully! 🎉', 'success');

    // Reset form
    document.getElementById('create-event-form').reset();

    // Reload events
    await loadEvents();

    // Try generating event QR code
    try {
      const qrResponse = await fetch('/api/generate-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: JSON.stringify({
            eventName: name,
            eventId: totalEventsCount - 1,
            contractAddress: CONTRACT_ADDRESS
          })
        })
      });

      if (qrResponse.ok) {
        const qrData = await qrResponse.json();
        if (qrData.qrBase64) {
          showModal('Event QR Code — ' + name, `<img src="${qrData.qrBase64}" alt="QR Code for ${name}">`);
        }
      }
    } catch (_) {
      // QR generation is optional
    }
  } catch (err) {
    console.error('Create event error:', err);
    showToast('Failed to create event: ' + parseError(err), 'error');
  }
}

/**
 * Update the organizer events list in the dashboard.
 */
function updateOrganizerEventsList(eventsData) {
  const list = document.getElementById('organizer-events-list');

  if (eventsData.length === 0) {
    list.innerHTML = `
      <div class="empty-state" style="padding: 30px;">
        <p class="empty-state-text">No events created yet</p>
      </div>`;
    return;
  }

  list.innerHTML = '';
  eventsData.forEach(ev => {
    const row = document.createElement('div');
    row.className = 'event-row';

    let badgeClass = ev.isActive ? 'badge-active' : 'badge-cancelled';
    let badgeText = ev.isActive ? 'Active' : 'Cancelled';

    row.innerHTML = `
      <div>
        <div class="event-row-name">${escapeHtml(ev.name)}</div>
        <div class="event-row-detail">${ev.ticketsSold}/${ev.maxTickets} tickets sold · ${ethers.formatEther(ev.priceWei)} ETH</div>
      </div>
      <div style="display: flex; align-items: center; gap: 10px;">
        <span class="badge ${badgeClass}">${badgeText}</span>
        ${ev.isActive ? `<button class="btn btn-danger btn-sm" onclick="cancelEvent(${ev.id})">Cancel</button>` : ''}
      </div>
    `;
    list.appendChild(row);
  });
}

/**
 * Cancel an event by ID.
 */
async function cancelEvent(eventId) {
  try {
    showToast('Cancelling event...', 'info');
    const tx = await contract.cancelEvent(eventId);
    await tx.wait();
    showToast('Event cancelled.', 'success');
    await loadEvents();
  } catch (err) {
    console.error('Cancel event error:', err);
    showToast('Failed to cancel event: ' + parseError(err), 'error');
  }
}

/**
 * Handle the Set Verifier form submission.
 */
async function handleSetVerifier(e) {
  e.preventDefault();

  const address = document.getElementById('verifier-address').value.trim();
  const enabled = document.getElementById('verifier-enabled').checked;

  if (!ethers.isAddress(address)) {
    showToast('Please enter a valid Ethereum address.', 'error');
    return;
  }

  try {
    showToast('Setting verifier...', 'info');
    const tx = await contract.setVerifier(address, enabled);
    await tx.wait();
    showToast(`Verifier ${enabled ? 'enabled' : 'disabled'} successfully!`, 'success');
    document.getElementById('set-verifier-form').reset();
    document.getElementById('verifier-enabled').checked = true;
  } catch (err) {
    console.error('Set verifier error:', err);
    showToast('Failed to set verifier: ' + parseError(err), 'error');
  }
}

/**
 * Withdraw funds from the contract.
 */
async function handleWithdrawFunds() {
  try {
    showToast('Withdrawing funds...', 'info');
    const tx = await contract.withdrawFunds();
    await tx.wait();
    showToast('Funds withdrawn successfully! 💰', 'success');
    await updateWalletUI();
  } catch (err) {
    console.error('Withdraw error:', err);
    showToast('Failed to withdraw: ' + parseError(err), 'error');
  }
}

// ============================================
// GATE VERIFIER (QR Scanner + Dual Confirmation)
// ============================================

let html5QrCode = null;
let verifyTokenId = null;
let verifyWalletAddress = null;

/**
 * Start the camera-based QR code scanner.
 */
function startScanner() {
  if (!isVerifier) {
    showToast('Only verified gate verifiers can use the scanner.', 'error');
    return;
  }

  if (!html5QrCode) {
    html5QrCode = new Html5Qrcode('qr-reader');
  }

  document.getElementById('btn-start-scanner').style.display = 'none';
  document.getElementById('btn-stop-scanner').style.display = '';

  html5QrCode.start(
    { facingMode: 'environment' },
    { fps: 10, qrbox: { width: 250, height: 250 } },
    (decodedText) => {
      // Successfully scanned a QR code
      try {
        const data = JSON.parse(decodedText);
        if (data.tokenId !== undefined && data.wallet) {
          document.getElementById('verify-token-id').value = data.tokenId;
          document.getElementById('verify-wallet').value = data.wallet;
          stopScanner();
          showToast('QR Code scanned! Starting verification...', 'success');
          startVerificationFlow();
        } else {
          showToast('Invalid QR code format — missing tokenId or wallet.', 'error');
        }
      } catch (e) {
        showToast('Could not parse QR code data.', 'error');
      }
    },
    (errorMessage) => {
      // Ignore scan errors (camera is still trying)
    }
  ).catch(err => {
    console.error('Scanner start error:', err);
    showToast('Could not access camera: ' + err, 'error');
    document.getElementById('btn-start-scanner').style.display = '';
    document.getElementById('btn-stop-scanner').style.display = 'none';
  });
}

/**
 * Stop the QR code scanner.
 */
function stopScanner() {
  if (html5QrCode && html5QrCode.isScanning) {
    html5QrCode.stop().then(() => {
      document.getElementById('btn-start-scanner').style.display = '';
      document.getElementById('btn-stop-scanner').style.display = 'none';
    }).catch(err => console.error('Stop scanner error:', err));
  }
}

/**
 * Start the 3-step secure verification flow.
 */
async function startVerificationFlow() {
  if (!isVerifier) {
    showToast('Only verified gate verifiers can start verification.', 'error');
    return;
  }

  verifyTokenId = document.getElementById('verify-token-id').value.trim();
  verifyWalletAddress = document.getElementById('verify-wallet').value.trim();

  if (!verifyTokenId || !verifyWalletAddress) {
    showToast('Token ID and Wallet Address are required.', 'error');
    return;
  }

  if (!ethers.isAddress(verifyWalletAddress)) {
    showToast('Invalid wallet address.', 'error');
    return;
  }

  // Show the verification flow card
  document.getElementById('verification-flow').style.display = '';
  resetStepUI();

  // ── STEP 1: On-chain validity check ──
  const step1Body = document.getElementById('step1-body');
  const step1Status = document.getElementById('step1-status');
  step1Body.textContent = 'Checking on-chain validity...';

  try {
    const isValid = await contract.isTicketValid(verifyTokenId, verifyWalletAddress);

    if (isValid) {
      const eventId = Number(await contract.ticketEvent(verifyTokenId));
      const ev = await contract.events(eventId);

      step1Body.innerHTML = `
        <div class="verify-result-box verify-result-success">
          ✅ <strong>Ticket is VALID on-chain</strong>
        </div>
        <div class="card-detail"><span class="card-detail-label">Token ID:</span> <span>#${verifyTokenId}</span></div>
        <div class="card-detail"><span class="card-detail-label">Event:</span> <span>${escapeHtml(ev.name)}</span></div>
        <div class="card-detail"><span class="card-detail-label">Holder:</span> <span>${truncateAddress(verifyWalletAddress)}</span></div>
      `;
      step1Status.textContent = '✅';

      // Unlock step 2
      document.getElementById('verify-step-2').style.opacity = '1';
      document.getElementById('btn-prove-ownership').disabled = false;
    } else {
      step1Body.innerHTML = `
        <div class="verify-result-box verify-result-fail">
          ❌ <strong>Ticket is INVALID</strong> — Already used or wallet doesn't own this ticket.
        </div>
      `;
      step1Status.textContent = '❌';
    }
  } catch (err) {
    step1Body.innerHTML = `
      <div class="verify-result-box verify-result-fail">
        ❌ <strong>Error:</strong> ${parseError(err)}
      </div>
    `;
    step1Status.textContent = '❌';
  }
}

/**
 * Step 2: Ticket holder proves they own the wallet by signing a message.
 * This prevents screenshot fraud — only the real wallet owner can sign.
 */
async function proveOwnership() {
  const step2Body = document.getElementById('step2-body');
  const step2Status = document.getElementById('step2-status');

  try {
    // Get current MetaMask account
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const currentAddr = accounts[0];

    // Check that MetaMask is set to the ticket holder's account
    if (currentAddr.toLowerCase() !== verifyWalletAddress.toLowerCase()) {
      step2Body.innerHTML = `
        <div class="verify-result-box verify-result-warn">
          ⚠️ <strong>Wrong MetaMask account!</strong><br>
          Connected: <code>${truncateAddress(currentAddr)}</code><br>
          Required: <code>${truncateAddress(verifyWalletAddress)}</code><br><br>
          <em>Ticket holder: please switch MetaMask to your account.</em>
        </div>
        <button class="btn btn-primary" style="margin-top: 12px;" onclick="proveOwnership()">🦊 Try Again</button>
      `;
      showToast('Ticket holder must switch to their MetaMask account!', 'error');
      return;
    }

    // Create a unique challenge message with timestamp
    const timestamp = Math.floor(Date.now() / 1000);
    const message = `I am the owner of TicketNFT Token #${verifyTokenId}.\nTimestamp: ${timestamp}\nContract: ${CONTRACT_ADDRESS}`;

    step2Body.innerHTML = `
      <div class="verify-result-box" style="background: var(--color-info-light); border-color: var(--color-info); color: var(--color-info);">
        🦊 <strong>MetaMask will ask you to sign a message.</strong><br>
        This proves you own this wallet — no gas fee required.
      </div>
    `;

    // Request MetaMask signature (personal_sign — free, no gas)
    const tempProvider = new ethers.BrowserProvider(window.ethereum);
    const holderSigner = await tempProvider.getSigner();
    const signature = await holderSigner.signMessage(message);

    // Verify the signature matches the expected wallet
    const recoveredAddress = ethers.verifyMessage(message, signature);

    if (recoveredAddress.toLowerCase() === verifyWalletAddress.toLowerCase()) {
      step2Body.innerHTML = `
        <div class="verify-result-box verify-result-success">
          ✅ <strong>Ownership VERIFIED!</strong><br>
          Signature confirmed for ${truncateAddress(verifyWalletAddress)}.<br>
          <em>This person is the real ticket owner — not a screenshot.</em>
        </div>
      `;
      step2Status.textContent = '✅';

      // Unlock step 3
      document.getElementById('verify-step-3').style.opacity = '1';
      document.getElementById('btn-mark-used-final').disabled = false;

      showToast('Ownership verified! Verifier can now mark ticket as used.', 'success');
    } else {
      step2Body.innerHTML = `
        <div class="verify-result-box verify-result-fail">
          ❌ <strong>Signature mismatch!</strong> The signer doesn't match the ticket holder.
        </div>
        <button class="btn btn-primary" style="margin-top: 12px;" onclick="proveOwnership()">🦊 Try Again</button>
      `;
      step2Status.textContent = '❌';
    }
  } catch (err) {
    console.error('Prove ownership error:', err);
    if (err.code === 'ACTION_REJECTED' || err.code === 4001) {
      showToast('Signature request was rejected by the user.', 'error');
      step2Body.innerHTML = `
        <div class="verify-result-box verify-result-fail">
          ❌ Signature rejected. The ticket holder must sign to prove ownership.
        </div>
        <button class="btn btn-primary" style="margin-top: 12px;" onclick="proveOwnership()">🦊 Try Again</button>
      `;
    } else {
      showToast('Error: ' + parseError(err), 'error');
    }
  }
}

/**
 * Step 3: Verifier confirms and marks the ticket as used on-chain.
 * Verifier must switch MetaMask back to their verifier account.
 */
async function markUsedFinal() {
  const step3Body = document.getElementById('step3-body');
  const step3Status = document.getElementById('step3-status');

  try {
    step3Body.innerHTML = `
      <div class="verify-result-box" style="background: var(--color-info-light); border-color: var(--color-info); color: var(--color-info);">
        🦊 <strong>Confirm the transaction in MetaMask</strong> to mark Token #${verifyTokenId} as used.
      </div>
    `;

    showToast('Sending markUsed transaction...', 'info');

    // Create contract instance with the current signer (should be the verifier)
    const tempProvider = new ethers.BrowserProvider(window.ethereum);
    const verifierSigner = await tempProvider.getSigner();
    const verifierContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, verifierSigner);

    const tx = await verifierContract.markUsed(verifyTokenId);
    await tx.wait();

    step3Body.innerHTML = `
      <div class="verify-result-box verify-result-success">
        ✅ <strong>ENTRY GRANTED!</strong><br>
        Token #${verifyTokenId} has been verified and marked as used.<br>
        The ticket holder may enter the event.
      </div>
    `;
    step3Status.textContent = '✅';

    showToast('Ticket verified & marked as used! Entry granted ✅', 'success');
  } catch (err) {
    console.error('Mark used error:', err);
    step3Body.innerHTML = `
      <div class="verify-result-box verify-result-fail">
        ❌ <strong>Failed:</strong> ${parseError(err)}<br><br>
        <em>Make sure MetaMask is set to a <strong>verifier</strong> account.</em>
      </div>
      <button class="btn btn-success" style="margin-top: 12px;" onclick="markUsedFinal()">✅ Try Again</button>
    `;
    showToast('Failed: ' + parseError(err), 'error');
  }
}

/**
 * Reset the verification flow to scan another ticket.
 */
function resetVerificationFlow() {
  document.getElementById('verification-flow').style.display = 'none';
  document.getElementById('verify-token-id').value = '';
  document.getElementById('verify-wallet').value = '';
  verifyTokenId = null;
  verifyWalletAddress = null;
  resetStepUI();
}

/**
 * Reset all step UI elements to their initial state.
 */
function resetStepUI() {
  document.getElementById('step1-status').textContent = '';
  document.getElementById('step1-body').textContent = 'Waiting to start...';

  document.getElementById('verify-step-2').style.opacity = '0.4';
  document.getElementById('step2-status').textContent = '';
  document.getElementById('step2-body').innerHTML = `
    <p style="margin-bottom: 12px; color: var(--color-text-secondary); font-size: 0.9rem;">
      🛡️ <strong>Anti-fraud step:</strong> The ticket holder must switch MetaMask to their account and sign a message to prove they actually own this wallet (not just a screenshot).
    </p>
    <button class="btn btn-primary" id="btn-prove-ownership" onclick="proveOwnership()" disabled>
      🦊 Prove I Own This Ticket
    </button>
  `;

  document.getElementById('verify-step-3').style.opacity = '0.4';
  document.getElementById('step3-status').textContent = '';
  document.getElementById('step3-body').innerHTML = `
    <p style="margin-bottom: 12px; color: var(--color-text-secondary); font-size: 0.9rem;">
      Verifier: Switch MetaMask back to your verifier account and confirm the transaction.
    </p>
    <button class="btn btn-success" id="btn-mark-used-final" onclick="markUsedFinal()" disabled>
      ✅ Mark as Used &amp; Allow Entry
    </button>
  `;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Show a toast notification.
 * @param {string} message - The toast message.
 * @param {'success'|'error'|'info'} type - The toast type.
 */
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');

  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️'
  };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span class="toast-message">${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);

  // Auto-remove after 4 seconds
  setTimeout(() => {
    toast.style.animation = 'toastSlideOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

/**
 * Show a modal with a title and HTML body.
 */
function showModal(title, bodyHtml) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = bodyHtml;
  document.getElementById('modal-overlay').classList.add('active');
}

/**
 * Hide the modal.
 */
function hideModal(e) {
  // If called from overlay click, only close if clicking on overlay itself
  if (e && e.target !== e.currentTarget) return;
  document.getElementById('modal-overlay').classList.remove('active');
}

/**
 * Truncate an Ethereum address for display.
 */
function truncateAddress(addr) {
  if (!addr) return '';
  return addr.slice(0, 6) + '...' + addr.slice(-4);
}

/**
 * Escape HTML characters to prevent XSS.
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Parse error messages from ethers/contract errors.
 */
function parseError(err) {
  // Check for revert reason
  if (err.reason) return err.reason;
  if (err.data && err.data.message) return err.data.message;
  if (err.error && err.error.message) return err.error.message;

  // Check for user rejection
  if (err.code === 'ACTION_REJECTED' || err.code === 4001) {
    return 'Transaction rejected by user.';
  }

  // Fallback
  const msg = err.message || String(err);
  // Try to extract revert reason from the message
  const match = msg.match(/reason="([^"]+)"/);
  if (match) return match[1];

  // Truncate long messages
  return msg.length > 120 ? msg.substring(0, 120) + '...' : msg;
}

/**
 * Create an empty state element.
 */
function createEmptyState(icon, text, hint) {
  const div = document.createElement('div');
  div.className = 'empty-state';
  div.innerHTML = `
    <div class="empty-state-icon">${icon}</div>
    <p class="empty-state-text">${escapeHtml(text)}</p>
    ${hint ? `<p class="empty-state-hint">${escapeHtml(hint)}</p>` : ''}
  `;
  return div;
}
