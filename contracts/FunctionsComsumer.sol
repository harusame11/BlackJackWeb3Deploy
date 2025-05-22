// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {FunctionsClient} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import {ConfirmedOwner} from "@chainlink/contracts/src/v0.8/shared/access/ConfirmedOwner.sol";
import {FunctionsRequest} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

/**
 * 示例合约：演示如何通过Chainlink Functions与DON网络交互，并根据外部数据铸造NFT。
 * 注意：本合约仅为演示用途，未经过安全审计，切勿用于生产环境！
 */
contract FunctionsConsumerExample is FunctionsClient, ERC721URIStorage {
    using FunctionsRequest for FunctionsRequest.Request;

    // NFT的tokenId计数器
    uint256 public tokenId = 0;
    // 记录请求ID到玩家地址的映射
    mapping(bytes32 => address) reqIdToAddr;
    // NFT元数据（IPFS地址）
    string constant META_DATA = "ipfs://QmfNhhpUezQLcyqXBGL4ehPwo7Gfbwk9yy3YcJqGgr9dPb";
    // DON密钥槽位ID
    uint8 public secretsSlotId;
    // DON密钥版本号
    uint64 public secretsVersion;
    // Chainlink Functions订阅ID
    uint64 public subId;

    // Chainlink Functions路由器合约地址（Sepolia测试网）
    address public constant ROUTER_ADDR = 0xb83E47C2bC239B3bf370bc41e1459A34b41238D0;

    // 最近一次请求的ID、响应和错误信息
    bytes32 public s_lastRequestId;
    bytes public s_lastResponse;
    bytes public s_lastError;
    // 请求消耗的最大Gas
    uint32 constant public GAS_LIMIT = 300_000;
    // DON网络ID（字节形式）
    bytes32 constant public DON_ID = 0x66756e2d657468657265756d2d7365706f6c69612d3100000000000000000000;
    // Chainlink Functions执行的JS脚本源码
    string constant SOURCE = 
        'if(!secrets.apiKey) {throw Error("API key is not provided")};'
        "const apiKey = secrets.apiKey;"
        "const playerAddress = args[0];"
        "const apiResponse = await Functions.makeHttpRequest({"
            'url: "https://xhd2vqevdalmltc7kayye4toxy0beows.lambda-url.ap-southeast-2.on.aws/",'
            'method: "GET",'
            "headers: {"
            '"api-key": apiKey,'
            '"player": playerAddress}});'

        'if (apiResponse.error) {console.error(apiResponse.error);throw Error("Request failed");};'
        "const { data } = apiResponse;"
        'if(!data.score) {console.error("the user does not exist");throw Error("Score does not exist, request failed");};'
        "return Functions.encodeInt256(data.score);";

    // 自定义错误：请求ID不匹配
    error UnexpectedRequestID(bytes32 requestId);

    // 响应事件：记录每次请求的结果
    event Response(bytes32 indexed requestId, bytes response, bytes err);

    // 构造函数：初始化父合约和NFT名称
    constructor() FunctionsClient(ROUTER_ADDR) ERC721("BlackJack", "BJT") {}

    /**
     * 设置DON密钥相关配置
     * @param _secretsSlotId DON密钥槽位ID
     * @param _secretsVersion DON密钥版本号
     * @param _subId Chainlink Functions订阅ID
     */
    function setConfig(uint8 _secretsSlotId, uint64 _secretsVersion, uint64 _subId) public {
        secretsSlotId = _secretsSlotId;
        secretsVersion = _secretsVersion;
        subId = _subId;
    }

    /**
     * 向Chainlink DON发起请求，获取玩家分数
     * @param args JS脚本参数（如玩家地址）
     * @param player 玩家地址
     * @return requestId 请求ID
     */
    function sendRequest(
        string[] memory args,
        address player
    ) external returns (bytes32 requestId) {
        require(secretsVersion > 0, "You have to set secrets version");
        // 构造Chainlink Functions请求
        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(SOURCE);

        // 添加DON托管的密钥
        if (secretsVersion > 0) {
            req.addDONHostedSecrets(
                secretsSlotId,
                secretsVersion
            );
        }
        // 设置参数
        if (args.length > 0) req.setArgs(args);
        // 发送请求到DON网络
        s_lastRequestId = _sendRequest(
            req.encodeCBOR(),
            subId,
            GAS_LIMIT,
            DON_ID
        );
        // 记录请求ID与玩家地址的映射
        reqIdToAddr[s_lastRequestId] = player;
        return s_lastRequestId;
    }

    /**
     * Chainlink DON回调函数，处理返回结果
     * @param requestId 请求ID
     * @param response DON返回的响应数据
     * @param err DON返回的错误信息
     */
    function fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) internal override {
        // 校验请求ID
        if (s_lastRequestId != requestId) {
            revert UnexpectedRequestID(requestId);
        }
        s_lastResponse = response;
        s_lastError = err;
        // 解码分数
        int256 score = abi.decode(response, (int256));
        address player = reqIdToAddr[requestId];
        // 如果分数大于1000，则为玩家铸造NFT奖励
        if(score > 1000) {
            safeMint(player, META_DATA);
        }
        emit Response(requestId, s_lastResponse, s_lastError);
    }

    /**
     * 内部函数：为玩家铸造NFT
     * @param player 玩家地址
     * @param metaDataUrl NFT元数据URL
     */
    function safeMint(address player, string memory metaDataUrl) internal {
        _safeMint(player, tokenId);
        _setTokenURI(tokenId, metaDataUrl);
        tokenId++;
    }
}