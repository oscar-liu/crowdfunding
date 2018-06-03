const assert = require('assert');
const path = require('path');
const Web3 = require('web3');
const BigNumber = require('bignumber');

// 1 配置 provider 
if (typeof web3 !== 'undefined') {
  web3 = new Web3(web3.currentProvider);
} else {
  web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:7545"));
}

const ProjectList = require(path.resolve(__dirname, '../compiled/ProjectList.json'));
const Project = require(path.resolve(__dirname, '../compiled/Project.json'));

let accounts,
	projectList,
	project;

describe('Project Contract', () => {
	//1. 部署前新建合约实例
	beforeEach(async () => {
        // 1.1 拿到 ganache 本地测试网络的账号
        accounts = await web3.eth.getAccounts();

        // 1.2 部署 ProjectList 合约
        projectList = await new web3.eth.Contract(JSON.parse(ProjectList.interface))
            .deploy({ data: ProjectList.bytecode })
            .send({ from: accounts[0], gas: '5000000' });

        // 1.3 调用 ProjectList 的 createProject 方法
        await projectList.methods.createProject('Ethereum DApp Tutorial', 100, 10000, 1000000).send({
            from: accounts[0],
            gas: '5000000',
        });

        // 1.4 获取刚创建的 Project 实例的地址
        const [address] = await projectList.methods.getProjects().call();

        // 1.5 生成可用的 Project 合约对象
        project = await new web3.eth.Contract(JSON.parse(Project.interface), address);
    });

	it('测评项目列表和项目地址', async () => {
        assert.ok(projectList.options.address);
        assert.ok(project.options.address);
    });

	it('测试项目属性是否都设置正确', async () => {
		const owner = await project.methods.owner().call();
        const description = await project.methods.description().call();
        const minInvest = await project.methods.minInvest().call();
        const maxInvest = await project.methods.maxInvest().call();
        const goal = await project.methods.goal().call();

        assert.equal(owner, accounts[0]);
        assert.equal(description, 'Ethereum DApp Tutorial');
        assert.equal(minInvest, 100);
        assert.equal(maxInvest, 10000);
        assert.equal(goal, 1000000);
	})


	it('测试 项目中的contribute 接口', async () => {
		const investor = accounts[1];
		const minInvest = await project.methods.minInvest().call();
        const maxInvest = await project.methods.maxInvest().call();
		const num = 500;
		assert.ok( num >= minInvest);
		assert.ok( num <= maxInvest);
		await project.methods.contribute().send({
			from : investor,
			value : num
		});

		const amount = await project.methods.investors(investor).call();
		assert.ok(amount == num);
	});


	it('测试一个完整的流程，投资，发起资金支出，投资人投票，交易支出', async ()=> {
		// 项目方、投资人、收款方账户
		const owner = accounts[0];
		const investor = accounts[1];
		const receiver = accounts[2];

		//收款人的收款前的余额
		let receiverBalance = await web3.eth.getBalance(receiver);
		const oldBalance = receiverBalance; //new BigNumber(receiverBalance);

		//投资项目
		await project.methods.contribute().send({
			from : investor,
			value : '5000'
		});

		//资金支出请求
		await project.methods.createPayment("买办公家具",2000,receiver).send({
			from : owner,
			gas : '210000'
		});

		//投票
		await project.methods.approvePayment(0).send({
			from : investor,
			gas: '100000'
		});

		//过半票数后，同意资金转账
		await project.methods.doPayment(0).send({
			from : owner,
			gas: '100000'
		});

		//检查payment 状态
		const payment = await project.methods.payments(0).call();
		assert.equal(payment.completed, true);
		assert.equal(payment.voterCount, 1);

		//收款后的余额
		let bn = await web3.eth.getBalance(receiver);
		const newBalance = bn; //new BigNumber(String(bn));
		// console.log({ oldBalance, newBalance});

	})

})


