pragma solidity ^0.4.23;

library SafeMath {
	function mul(uint a, uint b) internal pure returns (uint) {
		uint c = a * b;
		assert( a == 0 || c / a == b);
		return c;
	}

	function div(uint a , uint b) internal pure returns (uint) {
		uint c = a / b;
		return c;
	}

	function sub(uint a, uint b) internal pure returns (uint) {
		assert (b <= a);
		return a - b;
	}

	function add(uint a , uint b) internal pure returns (uint) {
		uint c = a + b;
		assert(c >= a);
		return c;
	}
}

contract Project {

	using SafeMath for uint;

	//自定义结构
	struct Payment {
		string description;
		uint amount;
		address receiver;
		bool completed;
		address[] voters;
	}

	address public owner;      //项目所有者
	string public description;    //项目介绍 
	uint public minInvest;    //最小投资金额
	uint public maxInvest;    //最大投资金额
	uint public goal;    //融资上限
	address[] public investors;    //投资人列表
	Payment[] public payments;    //资金支出列表


	modifier ownerOnly() {
		require(msg.sender == owner);
		_;
	}

	//构造函数，初始化，传入合约的基本属性
	constructor(string _description, uint _minInvest, uint _maxInvest, uint _goal) public {
		owner = msg.sender;
		description = _description;
		minInvest = _minInvest;
		maxInvest = _maxInvest;
		goal = _goal;
	}

	//参与项目的投资接口
	function contribute() public payable {
		require(msg.value >= minInvest);    //发送资金大于等于最小投资金额
		require(msg.value <= maxInvest);    //发送资金小于等于最大投资金额

		uint newBalance = 0;
		newBalance = address(this).balance.add(msg.value);
		require(newBalance <= goal); //本合约资金总额小于等于融资上限

		investors.push(msg.sender);    //加入投资人列表
	}

	//发起资金支出请求，要求传入资金明细
	function createPayment(string _description, uint _amount , address _receiver) ownerOnly public {
		Payment memory newPayment = Payment({
			description: _description,
			amount: _amount,
			receiver: _receiver,
			completed: false,
			voters: new address[](0)
		});
		payments.push(newPayment);   //加入到资金支出列表
	}

	//资金支出投票
	function approvePayment(uint index) public {
		Payment storage payment = payments[index];

		//
		bool isInvestor = false;
		for(uint i = 0; i < investors.length; i++){
			isInvestor = investors[i] == msg.sender;
			if(isInvestor) {
				break;
			}
		}
		require(isInvestor);

		//
		bool hasVoted = false;
		for(uint j=0; j<payment.voters.length; j++) {
			hasVoted = payment.voters[i] == msg.sender;
			if(hasVoted) {
				break;
			}
		}
		require(hasVoted);

		payment.voters.push(msg.sender);    //记录投票人信息到投票人列表
	}

	//资金支出
	function doPayment(uint index) ownerOnly public {

		Payment storage payment = payments[index];

		require(!payment.completed);
		require(address(this).balance >= payment.amount);  //检查钱包是否有足够的余额
		require(payment.voters.length > (investors.length / 2));    //赞成票数超过投资人数量的50%

		payment.receiver.transfer(payment.amount);    //转账
		payment.completed = true;
	}


}
