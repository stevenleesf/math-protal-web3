import React, { useEffect, useState } from "react";
import "./App.css";
import { ethers } from "ethers"; //ethers is a library that helps our frontend talk to our contract
import abi from "./utils/MathPortal.json";
import BeatLoader from "react-spinners/BeatLoader";
import { css, jsx } from '@emotion/react'


var randomMathQuestion = require('random-math-question');
const App = () => {
  const [currentAccount, setCurrentAccount] = useState("");
  /*
   * All state property to store all Maths
   */
  const [allMaths, setAllMaths] = useState([]);
  const [loading, setLoading] = useState('false');
  const [mathQuestion, setMathQuestion] = useState("");
  const [mathAnswer, setMathAnswer] = useState("");
  const [questionAnswer, setQuestionAnswer] = useState("")
  //So, contract address you have -- right? Remember when you deployed your contract and I told you to save the address? This is what it's asking for!
  const contractAddress = "0xc0389B98C397daD8C04d9E9039C289D5928e8DeE";
  //what's an ABI? Much earlier I mentioned how when you compile a contract, it creates a bunch of files for you under artifacts. An ABI is one of those files.
  const contractABI = abi.abi;

  const override = css`
  display: block;
  margin: 0 auto;
  border-color: white;
  margin-top: 50px;
  `;

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }

      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account);
        getAllMaths();
      } else {
        console.log("No authorized account found")
      }
    } catch (error) {
      console.log(error);
    }
  }

  /**
  * Implement your connectWallet method here
  */
  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
      window.location.reload();
    } catch (error) {
      console.log(error)
    }
  }
  const math = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        //A "Provider" is what we use to actually talk to Ethereum nodes. 
        //Remember how we were using Alchemy to deploy? Well in this case we use nodes that Metamask provides in the background to send/receive data from our deployed contract.
        if (mathAnswer.toString() === questionAnswer) {
          const provider = new ethers.providers.Web3Provider(ethereum);
          const signer = provider.getSigner();
          const mathPortalContract = new ethers.Contract(contractAddress, contractABI, signer);
          const maths = await mathPortalContract.getAllMaths();

          let qna = "The Question is " + mathQuestion + " = " + mathAnswer + ".";

          /*
          * You're using contractABI here
          */
          let count = await mathPortalContract.getTotalMath();
          console.log("Retrieved total math count...", count.toNumber());

          const mathTxn = await mathPortalContract.math(qna, { gasLimit: 300000 });
          console.log("Mining...", mathTxn.hash);

          setLoading('true');

          await mathTxn.wait();
          console.log("Mined -- ", mathTxn.hash);

          count = await mathPortalContract.getTotalMath();
          console.log("Retrieved total maths count...", count.toNumber());
          setLoading('false');

          getAllMaths();
        }
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  }

  const getAllMaths = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const mathPortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        /*
         * Call the getAllMaths method from your Smart Contract
         */
        const maths = await mathPortalContract.getAllMaths();

        /*
         * We only need address, timestamp, and message in our UI so let's
         * pick those out
         */
        const mathsCleaned = maths.map(math => {
          return {
            address: math.accId,
            timestamp: new Date(math.timestamp * 1000),
            message: math.message,
          };
        });

        /*
         * Store our data in React State
         */
        setAllMaths(mathsCleaned);
      } else {
        console.log("Ethereum object doesn't exist!")
      }
    } catch (error) {
      console.log(error);
    }
  }

  const getQuestionAndAnswer = async () => {
    var mathQuestion = randomMathQuestion.get();
    console.log("Question 1: " + mathQuestion.question);
    console.log("Answer: " + mathQuestion.answer);
    setMathQuestion(mathQuestion.question);
    setMathAnswer(mathQuestion.answer);
  }

  useEffect(() => {
    checkIfWalletIsConnected();
    getQuestionAndAnswer();

    let mathPortalContract;

    const onNewMath = (from, timestamp, message) => {
      console.log("NewMath", from, timestamp, message);
      setAllMaths(prevState => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message,
        },
      ]);
    };

    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      mathPortalContract = new ethers.Contract(contractAddress, contractABI, signer);
      mathPortalContract.on("NewMath", onNewMath);
    }

    return () => {
      if (mathPortalContract) {
        mathPortalContract.off("NewMath", onNewMath);
      }
    };
  }, [])

  return (
    <div className="mainContainer">
      <div className="dataContainer">
        <div className="header">
          👋 Hey there!
        </div>

        <div className="bio">
          I am steven and I worked on self-improvement so that's pretty cool right? Connect your Ethereum wallet and do a math question! {loading}
        </div>

        {currentAccount && (
          <div className="bio">
            {mathQuestion}
          </div>
        )}

        {
          currentAccount && loading === 'false' ? (
            <input name="mathArea"
              className="mathButton"
              placeholder="What the answer? Check the console for answer."
              type="text"
              id="mathAnswer"
              value={questionAnswer}
              onChange={e => setQuestionAnswer(e.target.value)} />) : currentAccount && loading === 'true' ?
            (<p>loading</p>) : null
        }

        {currentAccount && (
          <button className="mathButton" onClick={math}>
            Math Click
          </button>
        )}

        {/*
        * If there is no currentAccount render this button
        */}
        {!currentAccount && (
          <button className="mathButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}

        {
          currentAccount && loading === 'false' ? (
            <div className="listData">
              {allMaths.map((math, index) => {
                return (
                  <div key={index} style={{ backgroundColor: "OldLace", marginTop: "16px", padding: "8px" }}>
                    <div>Address: {math.address}</div>
                    <div>Time: {math.timestamp.toString()}</div>
                    <div>Message: {math.message}</div>
                  </div>)
              })}
            </div>
          ) :  <BeatLoader css={override} size={20} loading={loading} color={"#fff"}  speedMultiplier={1.5} />}
      </div>
    </div>
  );
}

export default App