import React, { useEffect, useState } from "react";
import { Header } from "./header";
import { useStake } from "../helpers/stakeHelper";
import { getContract, parseEther } from "viem";
import { STACKING_ADDRESS, ERC20_ADDRESS } from "../assests/adresses";
import ABI_STAKING from "../assests/abi/stackingAbi.json";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";

const Spot = () => {
  // ** states
  const [totalValueLocked, setTotalValueLocked] = useState("0");
  const [totalWeeklyAwards, setTotalWeeklyAwards] = useState("0");
  const [totalMinerRewads, setTotalMinerAwards] = useState("0");
  const [APY, setAPY] = useState("0");
  const [lockPeriod, setLockPeriod] = useState("0");
  const [myWeeklyRewards, setMyWeeklyRewards] = useState("0");
  const [myTotalRewards, setMyTotalRewards] = useState("0");
  const [amount, setAmount] = useState(0);
  const [autoCompound, setAutoCompound] = useState(false);

  const { stake, unstake } = useStake();
  const publicClient = usePublicClient();
  const { address } = useAccount();

  // ** handle autocompound change
  const handleAutoCompoundChange = (e) => {
    const value = e.target.value === "true";
    setAutoCompound(value);
  };

  // ** stake function
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await stake(amount, autoCompound);
    } catch (e) {
      console.log(e);
    }
  };

  // unstake function
  const handleUnstake = async () => {
    try {
      await unstake(myWeeklyRewards);
    } catch (e) {
      console.log(e);
    }
  };

  // ** functions to read values from contract
  useEffect(() => {
    const getTotalValueLocked = async () => {
      try {
        const totalValueLocked = await publicClient.readContract({
          abi: ABI_STAKING,
          address: STACKING_ADDRESS,
          functionName: "TotalStaked",
        });
        const jsNumber = parseInt(totalValueLocked.toString());
        setTotalValueLocked(jsNumber);
      } catch (err) {
        console.error(err);
      }
    };
    const getTotalWeeklyRewards = async () => {
      try {
        const totalWeekyRewards = await publicClient.readContract({
          abi: ABI_STAKING,
          address: STACKING_ADDRESS,
          functionName: "WeeklyMinerRewards",
        });
        const jsNumber = parseInt(totalWeekyRewards.toString());
        setTotalWeeklyAwards(jsNumber);
      } catch (err) {
        console.error(err);
      }
    };

    const getTotalMinerRewards = async () => {
      try {
        const totalMinerRewards = await publicClient.readContract({
          abi: ABI_STAKING,
          address: STACKING_ADDRESS,
          functionName: "TotalMinerRewards",
        });

        const jsNumber = parseInt(totalMinerRewards.toString());

        setTotalMinerAwards(jsNumber);
      } catch (err) {
        console.error(err);
      }
    };

    const getAPY = async () => {
      if (address) {
        try {
          const apy = await publicClient.readContract({
            abi: ABI_STAKING,
            address: STACKING_ADDRESS,
            functionName: "CalculateMinerAPY",
            args: [address],
          });

          const jsNumber = parseInt(apy.toString());

          setAPY(jsNumber);
        } catch (err) {
          console.error(err);
        }
      }
    };

    const getlockPeriod = async () => {
      try {
        const lockPeriod = await publicClient.readContract({
          abi: ABI_STAKING,
          address: STACKING_ADDRESS,
          functionName: "LockPeriod",
        });
        const jsNumber = parseInt(lockPeriod.toString());

        setLockPeriod(jsNumber);
      } catch (err) {
        console.error(err);
      }
    };

    const getmyWeeklyRewards = async () => {
      if (address) {
        try {
          const weeklyRewards = await publicClient.readContract({
            abi: ABI_STAKING,
            address: STACKING_ADDRESS,
            functionName: "PendingMinerReward",
            args: [address],
          });
          const jsNumber = parseInt(weeklyRewards.toString());

          setMyWeeklyRewards(jsNumber);
        } catch (err) {
          console.error(err);
        }
      }
    };

    const getMyTotalRewards = async () => {
      if (address) {
        try {
          const myTotalRewards = await publicClient.readContract({
            abi: ABI_STAKING,
            address: STACKING_ADDRESS,
            functionName: "CalculateMinerReward",
            args: [address],
          });
          const jsNumber = parseInt(myTotalRewards.toString());

          setMyTotalRewards(jsNumber);
        } catch (err) {
          console.error(err);
        }
      }
    };

    if (address) {
      getTotalValueLocked();
      getTotalWeeklyRewards();
      getTotalMinerRewards();
      getAPY();
      getlockPeriod();
      getmyWeeklyRewards();
      getMyTotalRewards();
    }
  }, [address, publicClient]);

  return (
    <div className="abc">
      <Header />
      {/* <div className="Header_Container">
        <div className="Header_logo">
          <img src={a} alt="no images" />
        </div>
        <div className="Header_wallet">0x69420....DEAD</div>
      </div> */}
      <div className="Conatiner-Box">
        <div className="Items">
          <h3>TOTAL VALUE LOCKED</h3>
          <h1>$950.68</h1>
          <p>{totalValueLocked} MiM</p>
        </div>
        <div className="Items">
          <h3>TOTAL WEEKLY REWARDS</h3>
          <h1>$64.91</h1>
          <p>{totalWeeklyAwards} MiM</p>
        </div>
        <div className="Items">
          <h3>TOTAL REWARDS DISTRIBUTED</h3>
          <h1>$1392.24</h1>
          <p>{totalMinerRewads} MiM</p>
        </div>
      </div>
      <div className="DXS-Container">
        <h1 className="title">MiM-ETH | TVL: $69696969.69</h1>
        <p className="desc">1 MiM-ETH = $69.53k</p>
        <span className="link">Get MiM-ETH</span>
        <div className="flexing">
          <div className="box1">
            <h3>TOTAL APY</h3>
            <h1>{APY}%</h1>
          </div>
          {
            <div className="box1">
              <h3>AUTO-COMPOUND</h3>
              <h1>OFF</h1>
            </div>
          }
          <div className="box1">
            <h3>LOCK PERIOD</h3>
            <h1>{lockPeriod}</h1>
          </div>
        </div>
        <div className="flexing">
          <div className="box1">
            <h3>MY PENDING REWARDS</h3>
            <h1>{myWeeklyRewards} MiM</h1>
          </div>
          <div className="box1">
            <h3>MY STAKE</h3>
            <h1>MiM-ETH</h1>
          </div>
          <div className="box1">
            <h3>MY TOTAL REWARDS</h3>
            <h1>{myTotalRewards} MiM</h1>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <form onSubmit={handleSubmit}>
            <div>
              <input
                type="number"
                placeholder="enter amount"
                onChange={(e) => {
                  setAmount(e.target.value);
                }}
                required
                style={{
                  width: "200px",
                  height: "45px",
                  fontSize: "20px",
                  color: "#fff",
                  border: "1px solid #fff",
                  marginTop: "10px",
                }}
              />
            </div>
            <div>
              <label
                for="auto-compound"
                style={{
                  height: "45px",
                  color: "#fff",
                  fontSize: "15px",
                }}
              >
                Auto Compound?
              </label>
              <select
                id="auto-compound"
                name="auto-compound"
                onChange={handleAutoCompoundChange}
                style={{
                  color: "#000",
                  fontSize: "20px",
                  marginTop: "10px",
                  marginLeft: "10px",
                }}
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
            <div>
              <button type="submit" className="btnapp">
                APPROVE
              </button>
            </div>
          </form>
        </div>

        <button className="btnhar" onClick={handleUnstake}>
          CLAIM MINER REWARDS = {myWeeklyRewards}
        </button>
        <p className="para">YOU HAVE NO STAKES IN THIS POOL</p>
        <p className="refresh">REFRESH</p>

        <div className="toggleSwitch">
          <span className="toggleLabel">AUTO-COMPOUND REWARDS</span>
          <input
            type="checkbox"
            id="autoCompoundToggle"
            aria-label="Auto-Compound Miner Rewards"
          />
          <span className="disclaimer">TOGGLE TRIGGERS ON-CHAIN EVENT</span>
        </div>
      </div>
    </div>
  );
};

export default Spot;
