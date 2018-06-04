const fs = require('fs-extra');
const path = require('path');
const Web3 = require('web3');
const HDWalletProvider = require('truffle-hdwallet-provider');


 // bytecode
const contractPath = path.resolve(__dirname, '../compiled/ProjectList.json');
const { interface, bytecode } = require(contractPath);



const provider = new HDWalletProvider(
    'style trim couch clean between famous shy dragon traffic taste manage swallow',
    'https://rinkeby.infura.io/GXFJhitV5GIvV7tdwwnv'
);
const web3 = new Web3(provider);

// if (typeof web3 !== 'undefined') {
//   web3 = new Web3(provider);
// } else {
//   web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:7545"));
// }

(async () => {
    // 4. 获取钱包里面的账户
    const accounts = await web3.eth.getAccounts();
    console.log('合约部署账户:', accounts[0]);

    // 5. 创建合约实例并且部署
    console.time('合约部署耗时');
    const result = await new web3.eth.Contract(JSON.parse(interface))
        .deploy({ data: bytecode })
        .send({ from: accounts[0], gas: '5000000' });
    console.timeEnd('合约部署耗时');

    const contractAddress = result.options.address;

    console.log('合约部署成功:', contractAddress);
    console.log('合约查看地址:', `https://rinkeby.etherscan.io/address/${contractAddress}`);

    // 6. 合约地址写入文件系统
    const addressFile = path.resolve(__dirname, '../address.json');
    fs.writeFileSync(addressFile, JSON.stringify(contractAddress));
    console.log('地址写入成功:', addressFile);

    process.exit();
})();
