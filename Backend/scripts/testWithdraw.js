const { ethers } = require("hardhat");

async function main() {
  const [owner, buyer] = await ethers.getSigners();
  const TicketNFT = await ethers.getContractFactory("TicketNFT");
  const contract = await TicketNFT.deploy();
  await contract.waitForDeployment();
  
  await contract.createEvent("Test Event", 100, ethers.parseEther("1.0"), "CID");
  
  await contract.connect(buyer).purchaseTicket(0, { value: ethers.parseEther("1.0") });
  
  const balanceBefore = await ethers.provider.getBalance(owner.address);
  const contractBalanceBefore = await ethers.provider.getBalance(await contract.getAddress());
  
  console.log("Owner balance before:", ethers.formatEther(balanceBefore));
  console.log("Contract balance before:", ethers.formatEther(contractBalanceBefore));
  
  const tx = await contract.withdrawFunds();
  const receipt = await tx.wait();
  
  const balanceAfter = await ethers.provider.getBalance(owner.address);
  const contractBalanceAfter = await ethers.provider.getBalance(await contract.getAddress());
  
  console.log("Owner balance after:", ethers.formatEther(balanceAfter));
  console.log("Contract balance after:", ethers.formatEther(contractBalanceAfter));
  console.log("Gas used:", receipt.gasUsed.toString());
}

main().catch(console.error);
