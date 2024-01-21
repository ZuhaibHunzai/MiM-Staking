// SPDX-License-Identifier: MIT
  
  
   pragma solidity ^0.8.0;

/**
 * @dev Provides a modifier to prevent reentrant calls to a function.
 * This is a critical security feature for preventing reentrancy attacks, 
 * a common vulnerability in smart contracts where external function calls 
 * allow for unexpected behavior.
 */
abstract contract ReentrancyGuard {
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    uint256 private _status = _NOT_ENTERED;

    modifier nonReentrant() {
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }
}

/**
 * @dev Interface for the ERC20 standard as defined in the EIP.
 */
interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
}
/**
 * @title MagicInternetStakers
 * @dev Implements a staking mechanism for MiM Token, offering functionalities 
 * such as staking, unstaking, reward claiming, reward tracking, and auto-compounding. 
 * This contract includes security features like reentrancy protection, rate 
 * limiting, and iterative methods to prevent gas limit issues.
 */
contract MagicInternetStakers is ReentrancyGuard {
    IERC20 public immutable Token;
    address private _owner;

    // Constants for various limits and parameters
    uint256 public constant MaxLockPeriod = 172800; // 48 hours in seconds
    uint256 public constant MaxUnstakeIterations = 100; // Limits the number of iterations to prevent gas limit issues
    uint256 public constant ClaimCooldown = 1 hours; // Rate limiting for claim rewards
    uint256 public constant MaxStakeAmount = 200000 * (10 ** 9); // Maximum stake amount is 200,000 MiM

    // State variables for staking mechanics
    uint256 public RewardInterval = 3600; // 1 hour in seconds
    uint256 public TotalStaked;
    uint256 public TotalMinerRewards;
    uint256 public LockPeriod = 3600; // Default lock period
    
    bool public IsMinerAutoCompoundEnabled = true;

    // Structs for managing staking information
    struct Stake {
        uint256 amount;
        uint256 stakeTime;
    }

    struct StakerInfo {
        uint256 totalBalance;
        uint256 reward;
        uint256 lastClaimTime;
        bool autoCompound;
        Stake[] stakes;
    }

    // Mapping for stakers and an additional mapping for managing stake indexes
    mapping(address => StakerInfo) public Stakers;
    mapping(address => mapping(uint256 => uint256)) private stakeIndex; // New mapping to efficiently manage stakes

    // Events for tracking contract interactions
    event Staked(address indexed user, uint256 amount, bool autoCompound);
    event Unstaked(address indexed user, uint256 amount);
    event RewardClaimed(address indexed user, uint256 reward);
    event RewardsDeposited(uint256 amount);
    event Withdrawal(address indexed user, uint256 amount);
    event AutoCompoundToggled(bool status);

    // Modifier to restrict certain functions to the contract owner
    modifier onlyOwner() {
        require(msg.sender == _owner, "MagicInternetStakers: caller is not the owner");
        _;
    }

    /**
     * @dev Initializes the contract by setting the token address and owner.
     * @param TokenAddress Address of the ERC20 token to be staked.
     */
    constructor(address TokenAddress) {
        _owner = msg.sender;
        Token = IERC20(TokenAddress);
    }

    /**
     * @dev Allows the owner to deposit rewards into the contract.
     * These rewards are distributed to Stakers based on their staked amounts and durations.
     * @param _amount The amount of Tokens to be added to the rewards pool.
     */
    function DepositMinerRewards(uint256 _amount) external onlyOwner {
        require(Token.transferFrom(msg.sender, address(this), _amount), "Transfer failed");
        TotalMinerRewards += _amount;
        emit RewardsDeposited(_amount);
    }

    /**
     * @dev Allows users to stake their Tokens. Staked Tokens are added 
     * to the user's total balance and recorded.
     * @param _amount Amount of Tokens the user wants to stake.
     * @param _autoCompound Whether the user wants to enable auto-compounding of rewards.
     */
    function StakeMiners(uint256 _amount, bool _autoCompound) external nonReentrant {
    require(_amount > 0, "Amount must be greater than 0");
    StakerInfo storage staker = Stakers[msg.sender];
    uint256 newTotalStake = staker.totalBalance + _amount;
    require(newTotalStake <= MaxStakeAmount, "Total staking amount exceeds the maximum limit");
    require(Token.transferFrom(msg.sender, address(this), _amount), "Transfer failed");

    staker.totalBalance = newTotalStake;
    staker.autoCompound = _autoCompound;
    staker.lastClaimTime = block.timestamp;
    staker.stakes.push(Stake(_amount, block.timestamp));
    TotalStaked += _amount;
    emit Staked(msg.sender, _amount, _autoCompound);
}


    /**
 * @dev Allows users to claim their rewards. Handles auto-compounding and reward distribution,
 * ensuring that compounded rewards respect the MaxStakeAmount.
 */
function ClaimMinerRewards() external nonReentrant {
    StakerInfo storage staker = Stakers[msg.sender];
    uint256 reward = 0;

    for (uint256 i = 0; i < staker.stakes.length; i++) {
        if (block.timestamp - staker.stakes[i].stakeTime > RewardInterval) {
            uint256 stakerSharePerToken = TotalMinerRewards * 1e18 / TotalStaked;
            uint256 stakerShare = staker.stakes[i].amount * stakerSharePerToken / 1e18;
            uint256 stakingDuration = block.timestamp - staker.stakes[i].stakeTime;
            reward += (stakerShare * stakingDuration) / RewardInterval;
        }
    }

    require(reward > 0, "No rewards available to claim");
    if (staker.autoCompound) {
        uint256 compoundedStake = staker.totalBalance + reward;
        if (compoundedStake > MaxStakeAmount) {
            uint256 excessReward = compoundedStake - MaxStakeAmount;
            staker.reward += excessReward; // Assign excess to direct rewards
            reward = MaxStakeAmount - staker.totalBalance; // Remaining reward to be compounded
        }
        staker.totalBalance += reward; // Compound the rewards
    } else {
        staker.reward += reward; // Directly assign the reward
    }

    TotalMinerRewards -= reward;
    require(Token.transfer(msg.sender, staker.reward), "Failed to transfer rewards");

    staker.lastClaimTime = block.timestamp;
    emit RewardClaimed(msg.sender, staker.reward);
}
   
    /**
     * @dev Calculates the reward for a staker based on their staked amount, 
     * duration of staking, and daily rewards. Adjusted for precision in reward calculation.
     * @param _user Address of the staker.
     * @return Total reward calculated for the staker.
     */
    function CalculateMinerReward(address _user) public view returns (uint256) {
        StakerInfo storage staker = Stakers[_user];
        uint256 totalReward = 0;
        for (uint256 i = 0; i < staker.stakes.length; i++) {
            uint256 stakingDuration = block.timestamp - staker.stakes[i].stakeTime;
            uint256 Stakershare = staker.stakes[i].amount * TotalMinerRewards * 1e18 / TotalStaked / 1e18; // Adjusted precision
            totalReward += (Stakershare / RewardInterval) * stakingDuration;
        }
        return totalReward;
    }

    /**
     * @dev Allows Stakers to unstake their Tokens in respect to lock time. 
     * Redesigned to handle a large number of stakes more efficiently.
     * @param _amount Amount of Tokens the staker wants to unstake.
     */
    function UnstakeMiners(uint256 _amount) external nonReentrant {
        StakerInfo storage staker = Stakers[msg.sender];
        require(_amount > 0, "Invalid unstake amount");
        require(_amount <= staker.totalBalance, "Unstaking amount exceeds staked balance");

        uint256 remainingAmount = _amount;
        uint256 iterations = 0;
        while (remainingAmount > 0 && iterations < MaxUnstakeIterations) {
            uint256 stakeIdx = stakeIndex[msg.sender][iterations]; // Efficiently access stake index
            Stake storage firstStake = staker.stakes[stakeIdx];
            require(block.timestamp >= firstStake.stakeTime + LockPeriod, "Lock period has not passed for this stake");

            uint256 stakeAmount = firstStake.amount;
            if (stakeAmount <= remainingAmount) {
                remainingAmount -= stakeAmount;
                staker.totalBalance -= stakeAmount;
                TotalStaked -= stakeAmount;

                // Remove the stake efficiently
                uint256 lastIndex = staker.stakes.length - 1;
                if(stakeIdx != lastIndex) {
                    staker.stakes[stakeIdx] = staker.stakes[lastIndex];
                    stakeIndex[msg.sender][lastIndex] = stakeIdx;
                }
                staker.stakes.pop();
            } else {
                firstStake.amount -= remainingAmount;
                staker.totalBalance -= remainingAmount;
                TotalStaked -= remainingAmount;
                remainingAmount = 0;
            }
            iterations++;
        }
        require(remainingAmount == 0, "Unable to unstake full amount requested");
        require(Token.transfer(msg.sender, _amount - remainingAmount), "Transfer failed");
        emit Unstaked(msg.sender, _amount - remainingAmount);
    }

    /**
     * @dev Allows Stakers to withdraw their accumulated rewards.
     * Ensures the rewards are available and transfers them to the staker's address.
     */
    function WithdrawMinerRewards() external nonReentrant {
        StakerInfo storage staker = Stakers[msg.sender];
        uint256 reward = staker.reward;
        require(reward > 0, "No rewards to withdraw");
        require(Token.balanceOf(address(this)) >= reward, "Insufficient contract balance for reward payout");

        staker.reward = 0;
        require(Token.transfer(msg.sender, reward), "Transfer failed");
        emit Withdrawal(msg.sender, reward);
    }

    /**
     * @dev Allows the owner to clear any foreign Tokens sent to the contract by mistake.
     * Ensures that the Token to be cleared is not the staking Token.
     * @param TokenAddress Address of the foreign Token to be cleared.
     */
    function ClearForeignToken(address TokenAddress) external onlyOwner {
        require(TokenAddress != address(Token), "Cannot clear the staking Token");
        IERC20 foreignToken = IERC20(TokenAddress);
        uint256 balance = foreignToken.balanceOf(address(this));
        require(balance > 0, "No foreign Tokens to clear");
        require(foreignToken.transfer(_owner, balance), "Transfer failed");
    }
    
    /**
     * @dev Allows the owner to adjust the interval for reward calculation.
     * This function can be used to change the time interval of reward distribution.
     * @param _newInterval The new interval in seconds for reward calculation.
     */
    function AdjustRewardInterval(uint256 _newInterval) external onlyOwner {
        require(_newInterval > 0, "Interval must be greater than 0");
        RewardInterval = _newInterval;
    }

    /**
     * @dev Allows the owner to adjust the lock period for staking with a maximum lock time of 48hrs.
     * Useful for changing the staking dynamics based on governance or operational needs.
     * @param newLockPeriod The new lock period in seconds.
     */
    function AdjustLockPeriod(uint256 newLockPeriod) external onlyOwner {
        require(newLockPeriod <= MaxLockPeriod, "Lock period cannot exceed 48 hours");
        LockPeriod = newLockPeriod;
    }

    /**
     * @dev Calculates the pending miner reward for a user without altering the state.
     * @param _user Address of the user to calculate rewards for.
     * @return The calculated reward.
     */
    function PendingMinerReward(address _user) external view returns (uint256) {
        if (block.timestamp < Stakers[_user].lastClaimTime + RewardInterval) {
            return 0;
        }
        return CalculateMinerReward(_user);
    }

    /**
     * @dev Returns the total miners staked by a specific user.
     * Useful for users to track the total value of their miners staked in the contract.
     * @param _user Address of the user whose total miner balance is requested.
     * @return The total staked miners by the user.
     */
    function TotalStakedMinersByUser(address _user) public view returns (uint256) {
        return Stakers[_user].totalBalance;
    }

   /**
    * @dev Calculates the next time a user is eligible to claim their miner rewards.
    * This is the timestamp at which the user's last claim time plus the cooldown period has passed.
    * @param _user Address of the user whose next miner claim time is requested.
    * @return The timestamp of when the user can next claim miner rewards.
    */
    function NextMinerClaimTime(address _user) public view returns (uint256) {
        StakerInfo storage staker = Stakers[_user];
        uint256 nextClaimTime = staker.lastClaimTime + ClaimCooldown;

        if(block.timestamp < nextClaimTime) {
            return nextClaimTime - block.timestamp;
        } else {
            return 0;
        }
    }
    
        /**
     * @dev Toggles the auto-compound preference for the caller's stakes.
     * When auto-compounding is enabled, rewards will automatically be reinvested
     * as stakes, respecting the maximum stake amount. Any rewards that would
     * increase the stake beyond the maximum limit will be assigned as direct
     * rewards instead. This function allows a staker to switch their preference
     * for auto-compounding on or off. Emits an AutoCompoundToggled event upon
     * a successful change of preference.
     * @param _autoCompound The staker's desired auto-compound preference.
     */
    function ToggleMinerAutoCompound(bool _autoCompound) external {
        StakerInfo storage staker = Stakers[msg.sender];
        require(staker.totalBalance > 0, "No staked tokens to enable auto-compounding");

        staker.autoCompound = _autoCompound;
        emit AutoCompoundToggled(_autoCompound);
    }
     
      uint256 private constant PRECISION = 1e18; // Scaling factor for precision

     /**
     * @dev Calculates the Annual Percentage Yield (APY) for a given staker.
     * @param _staker Address of the staker.
     * @return The calculated APY (scaled by 1e18 for precision).
     */
    function CalculateAPY(address _staker) public view returns (uint256) {
        StakerInfo memory staker = Stakers[_staker];
        if (staker.totalBalance == 0 || TotalStaked == 0) {
            return 0;
        }

        uint256 totalRewardRate = _calculateTotalRewardRate(staker);
        uint256 compoundsPerYear = 365 days / RewardInterval;
        uint256 apy = _safeExponentiation(PRECISION + totalRewardRate / staker.totalBalance, compoundsPerYear) - PRECISION;

        return apy;
    }

    function _calculateTotalRewardRate(StakerInfo memory staker) private view returns (uint256) {
        return staker.totalBalance * TotalMinerRewards * PRECISION / TotalStaked;
    }

    function _safeExponentiation(uint256 base, uint256 exponent) private pure returns (uint256) {
        uint256 result = PRECISION;
        for (uint256 i = 0; i < exponent; i++) {
            result = result * base / PRECISION;
        }
        return result;
    }
}