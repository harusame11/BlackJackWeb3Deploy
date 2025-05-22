// index.mjs   ——   ES Module 语法
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';

// ✅ 建一个全局单例，避免每次 cold‑start 之外都重连
const client     = new DynamoDBClient({ region: 'ap-southeast-2' });
const docClient  = DynamoDBDocumentClient.from(client);

//表名字和Api
const TABLE_NAME = 'BlackJack';
const API_KEY = 'harusame0406'
export const handler = async (event) => {
  /* 1. 解析 player——放宽来源：header / query / path 三选一 */
  const player = event.headers?.["player"];
  const apiKey = event.headers?.["api-key"]
  if(apiKey !== API_KEY){
    return {
      statusCode: 401,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',   // ✅ 拼写
      },
      body: JSON.stringify({ message: '无效的 API Key' }),
    };
    }
  
  if (!player) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',   // ✅ 拼写
      },
      body: JSON.stringify({ message: '缺少 player 参数' }),
    };
  }

  /* 2. DynamoDB Get —— 只拿 player、score 两列 */
  const command = new GetCommand({
    TableName: TABLE_NAME,
    Key: { player },
  });

  try {
    const { Item } = await docClient.send(command);

    if (!Item) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ message: '未找到对应记录' }),
      };
    }

    /* 3. 成功返回 */
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(Item),
    };
  } catch (err) {
    console.error('[DynamoDB] 查询错误:', err);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ message: '服务器内部错误' }),
    };
  };
  }