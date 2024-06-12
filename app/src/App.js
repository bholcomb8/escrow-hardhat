import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import deploy from './deploy';
import Escrow from './Escrow';

const provider = new ethers.providers.Web3Provider(window.ethereum);

export async function approve(escrowContract, signer) {
  const approveTxn = await escrowContract.connect(signer).approve();
  await approveTxn.wait();
}

function App() {
  const [escrows, setEscrows] = useState([]);
  const [account, setAccount] = useState();
  const [signer, setSigner] = useState();

  useEffect(() => {
    async function getAccounts() {
      const accounts = await provider.send('eth_requestAccounts', []);
      setAccount(accounts[0]);
      setSigner(provider.getSigner());
    }

    getAccounts();
  }, []);

  useEffect(() => {
    const savedEscrows = JSON.parse(localStorage.getItem('escrows')) || [];
    setEscrows(savedEscrows);
  }, []);

  async function newContract() {
    const beneficiary = document.getElementById('beneficiary').value;
    const arbiterOne = document.getElementById('arbiterOne').value;
    const arbiterTwo = document.getElementById('arbiterTwo').value;
    const value = ethers.utils.parseUnits(document.getElementById('eth').value);
    const escrowContract = await deploy(signer, arbiterOne, arbiterTwo, beneficiary, value);

    const escrow = {
      address: escrowContract.address,
      arbiterOne,
      arbiterTwo,
      beneficiary,
      value: value.toString(),
      handleApprove: async () => {
        escrowContract.on('Approved', () => {
          document.getElementById(escrowContract.address).className = 'complete';
          document.getElementById(escrowContract.address).innerText = "✓ It's been approved!";
        });

        await approve(escrowContract, signer);
      },
    };

    const updatedEscrows = [...escrows, escrow];
    setEscrows(updatedEscrows);
    localStorage.setItem('escrows', JSON.stringify(updatedEscrows));
  }

  return (
    <div className="app-container">
      <div className="contract">
        <h1>New Contract</h1>
        <label>
          Arbiter Addresses (2/2 multisig)
          <input type="text" id="arbiterOne" placeholder="Arbiter 1 Address" />
          <input type="text" id="arbiterTwo" placeholder="Arbiter 2 Address" />
        </label>

        <label>
          Beneficiary Address
          <input type="text" id="beneficiary" placeholder="Beneficiary Address" />
        </label>

        <label>
          Deposit Amount (in ETH)
          <input type="text" id="eth" placeholder="0.0" />
        </label>

        <div
          className="button"
          id="deploy"
          onClick={(e) => {
            e.preventDefault();
            newContract();
          }}
        >
          Deploy
        </div>
      </div>

      <div className="existing-contracts">
        <h1>Existing Contracts</h1>

        <div id="container">
          {escrows.map((escrow) => {
            return (
              <div className="escrow-container" key={escrow.address}>
                <Escrow {...escrow} />
                <a href={`https://etherscan.io/address/${escrow.address}`} target="_blank" rel="noopener noreferrer">
                  View on Etherscan
                </a>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default App;
