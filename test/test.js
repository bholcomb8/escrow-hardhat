const { ethers } = require('hardhat');
const { expect } = require('chai');

describe('Escrow', function () {
  let contract;
  let depositor;
  let beneficiary;
  let arbiterOne;
  let arbiterTwo;
  const deposit = ethers.utils.parseEther('1');
  beforeEach(async () => {
    depositor = ethers.provider.getSigner(0);
    beneficiary = ethers.provider.getSigner(1);
    arbiterOne = ethers.provider.getSigner(2);
    arbiterTwo = ethers.provider.getSigner(3);
    const Escrow = await ethers.getContractFactory('Escrow');
    contract = await Escrow.deploy(
      arbiterOne.getAddress(),
      arbiterTwo.getAddress(),
      beneficiary.getAddress(),
      {
        value: deposit,
      }
    );
    await contract.deployed();
  });

  it('should be funded initially', async function () {
    let balance = await ethers.provider.getBalance(contract.address);
    expect(balance).to.eq(deposit);
  });

  describe('after approval from address other than the arbiters', () => {
    it('should revert', async () => {
      await expect(contract.connect(beneficiary).approve()).to.be.reverted;
    });
  });

  describe('after approval from only one of two arbiters', () => {
    it('should revert', async () => {
      const firstSig = await contract.connect(arbiterOne).Sign();
      await firstSig.wait();
      await expect(contract.connect(arbiterOne).approve()).to.be.reverted;
    });
  });

  describe('after approval from both arbiters AND passage of 1 day', () => {
    it('should revert', async () => {
      const firstSig = await contract.connect(arbiterOne).Sign();
      await firstSig.wait();
      const secondSig = await contract.connect(arbiterTwo).Sign();
      await secondSig.wait();
      await ethers.provider.send('evm_increaseTime', [24 * 60 * 60]);
      await expect(contract.connect(arbiterOne).approve()).to.be.reverted;
    });
  });

  describe('after approval from both arbiters AND passage of 7 days', () => {
    it('should transfer balance to beneficiary', async () => {
      const before = await ethers.provider.getBalance(beneficiary.getAddress());
      const firstSig = await contract.connect(arbiterOne).Sign();
      await firstSig.wait();
      const secondSig = await contract.connect(arbiterTwo).Sign();
      await secondSig.wait();
      await ethers.provider.send('evm_increaseTime', [7 * 24 * 60 * 60]);
      const approveTxn = await contract.connect(arbiterOne).approve();
      await approveTxn.wait();
      const after = await ethers.provider.getBalance(beneficiary.getAddress());
      expect(after.sub(before)).to.eq(deposit);
    });
  });
});
