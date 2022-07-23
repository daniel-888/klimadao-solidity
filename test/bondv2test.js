const { ethers } = require("hardhat");
const { expect } = require("chai");
const { beforeEach, describe, it } = require("mocha");
const { hexStripZeros } = require("ethers/lib/utils");

describe("bond v2 test", () => {
  const mineBlocks = async (blockNumber) => {
    await hre.network.provider.request({
      method: "hardhat_mine",
      params: [blockNumber, "0x1"],
    });
  };

  const getMockSigner = async (address) => {
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [address],
    });
    await network.provider.send("hardhat_setBalance", [
      address,
      "0x8AC7230489E80000",
    ]);
    return await ethers.getSigner(address);
  };

  const stakingAddress = "0x25d28a24Ceb6F81015bB0b2007D795ACAc411b4d";
  const stakingHelper = "0x4D70a031Fc76DA6a9bC0C922101A05FA95c3A227";
  const klimaAddress = "0x4e78011Ce80ee02d2c3e649Fb657E45898257815";
  const wsklimaAddress = "0xb0C22d8D350C67420f06F48936654f567C73E8C8";
  const treasuryAddress = "0x7Dd4f0B986F032A44F913BF92c9e8b7c17D77aD7";

  let deployer, governor, guardian, policy, vault, addrs;

  let authority, bond, token;

  beforeEach("deploy", async () => {
    [deployer, governor, guardian, policy, vault, ...addrs] =
      await ethers.getSigners();

    const AuthorityFactory = await ethers.getContractFactory("KlimaAuthority");
    authority = await AuthorityFactory.deploy(
      governor.address,
      guardian.address,
      policy.address,
      vault.address
    );
    await authority.deployed();

    // let blockTime = (
    //   await ethers.provider.getBlock(await ethers.provider.getBlockNumber())
    // ).timestamp;
    // console.log("t1 = ", blockTime);
    // await mineBlocks("0x5F5E100"); // 100000000
    // blockTime = (
    //   await ethers.provider.getBlock(await ethers.provider.getBlockNumber())
    // ).timestamp;
    // console.log("t2 = ", blockTime);

    const bondFactory = await ethers.getContractFactory(
      "KlimaBondDepositoryV2"
    );
    bond = await bondFactory.deploy(
      authority.address,
      klimaAddress,
      wsklimaAddress,
      stakingAddress,
      stakingHelper,
      treasuryAddress
    );
    await bond.deployed();

    const TokenFactory = await ethers.getContractFactory("ERC20Token");
    token = await TokenFactory.deploy("mock token", "MT");
    await token.deployed();
  });

  describe("create market", () => {
    it("policy can create market", async () => {
      const blockTime = (
        await ethers.provider.getBlock(await ethers.provider.getBlockNumber())
      ).timestamp;
      await (
        await bond
          .connect(policy)
          .create(
            token.address,
            ["10000000000000", "100000000000", "50000"],
            [false, true],
            [256, blockTime + 256],
            [16, 16]
          )
      ).wait();
      let market = await bond.markets(0);
      console.log("market = ", market);
    });

    it("non-policy cannot create market", async () => {
      const blockTime = (
        await ethers.provider.getBlock(await ethers.provider.getBlockNumber())
      ).timestamp;
      await expect(
        bond
          .connect(addrs[0])
          .create(
            token.address,
            ["10000000000000", "100000000000", "50000"],
            [false, true],
            [256, blockTime + 256],
            [16, 16]
          )
      ).to.be.revertedWith("UNAUTHORIZED");
    });

    it("test", async () => {
      let vault = await getMockSigner(treasuryAddress);
      let klima = await ethers.getContractAt("KlimaToken", klimaAddress);
      console.log("vault = ", vault.address);
      await await klima.connect(vault).mint(deployer.address, "10000000000");
      let bal = await klima.balanceOf(deployer.address);
      console.log("bal = ", bal.toNumber());
    });
  });
});
