import Web3 from 'web3'
const chainData = require('./config')

const web3 = new Web3(chainData.rpc); // replace YOUR_PROJECT_ID with your Infura project ID or node URL


const watchingAddresses : string[] = []

for (let key in chainData.contracts) {
    watchingAddresses.push(chainData.contracts[key])
}