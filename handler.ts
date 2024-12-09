import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import express from "express";
import serverless from "serverless-http";
import { randomBytes } from "crypto";
import axios from 'axios';
import { verifyExpiration } from "./helpers/verify-expiration";
import cors from 'cors';

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

const SHORT_URLS_TABLE = process.env.SHORT_URLS_TABLE as string;
const METRICS_TABLE = process.env.METRICS_TABLE as string;
const client = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(client);

app.use(express.json());

app.post("/short-url", async (req, res) => {
  const DEFAULT_TTL_IN_MINUTES = 60 * 24 * 7; // 7 days
  const { original_url, http_method, ttl } = req.body;

  if (!original_url || typeof original_url !== 'string') {
    res.json({ error: '"original_url" must be a string' }).send();
    return
  } else if (
    !http_method ||
    typeof http_method !== 'string' ||
    !['post', 'get'].includes(http_method.toLowerCase())
  ) {
    res.json({
      error:
        '"http_method" must be a string and must be either "post" or "get"',
    });
    return
  } else if (ttl && typeof ttl !== 'number') {
    res.json({ error: '"ttl" must be a number' });
    return
  }

  const createdAt = Math.floor(Date.now() / 1000);
  const expiresAt = ttl ? createdAt + ttl : createdAt + DEFAULT_TTL_IN_MINUTES;

  const payload = {
    original_url,
    unique_identifier: randomBytes(6).toString('hex'),
    http_method,
    created_at: createdAt,
    expires_at: expiresAt,
  };

  const params = {
    TableName: SHORT_URLS_TABLE,
    Item: payload,
  };

  try {
    const command = new PutCommand(params);
    await docClient.send(command);
    res.json(payload);
    return
  } catch (error) {
    console.error(error);
    res.json({ error: 'Could not create short URL' });
    return
  }
});

app.post("/:identifier", async (req, res) => {
  console.log('identifier:', req.params.identifier);
  const params = {
    TableName: SHORT_URLS_TABLE,
    Key: {
      unique_identifier: req.params.identifier.toString()
    },
  };

  try {
    const command = new GetCommand(params);
    const { Item } = await docClient.send(command);
    if (Item) {
      const {
        original_url,
        http_method,
        expires_at,
      } = Item;

      const isExpired = verifyExpiration(expires_at);
      if (isExpired) {
        res.status(410).json({ error: 'Short URL has expired' });
        return
      }

      if (http_method.toLowerCase() !== 'post') {
        res.status(405).json({ error: 'This URL only accepts POST requests' });
        return
      }

      const metricsParams = {
        TableName: METRICS_TABLE,
        Key: {
          unique_identifier: req.params.identifier.toString(),
        },
        UpdateExpression: "SET access_count = if_not_exists(access_count, :zero) + :increment, last_accessed = :lastAccessed",
        ExpressionAttributeValues: {
          ":increment": 1,
          ":zero": 0,
          ":lastAccessed": new Date().toISOString(),
        },
        ReturnValues: "UPDATED_NEW" as const,
      };

      try {
        await docClient.send(new UpdateCommand(metricsParams));
        console.log(`Metrics updated for identifier: ${req.params.identifier}`);
      } catch (metricsError) {
        console.error('Error updating metrics:', metricsError);
      }
      
      axios.post(original_url, req.body)

      res.status(200).json({ message: 'Request sent successfully' });
      return
    } else {
      res
        .status(404)
        .json({ error: 'Could not find short URL with the given identifier' });
      return
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Could not retrieve short URL' });
    return
  }
});

app.get("/:identifier", async (req, res) => {
  console.log('identifier:', req.params.identifier);
  const params = {
    TableName: SHORT_URLS_TABLE,
    Key: {
      unique_identifier: req.params.identifier.toString()
    },
  };

  try {
    const command = new GetCommand(params);
    const { Item } = await docClient.send(command);
    if (Item) {
      const {
        original_url,
        http_method,
        expires_at,
      } = Item;

      const isExpired = verifyExpiration(expires_at);
      if (isExpired) {
        res.status(410).json({ error: 'Short URL has expired' });
        return;
      }

      if (http_method.toLowerCase() !== 'get') {
        res.status(405).json({ error: 'This URL only accepts GET requests' });
        return;
      }

      const metricsParams = {
        TableName: METRICS_TABLE,
        Key: {
          unique_identifier: req.params.identifier.toString(),
        },
        UpdateExpression: "SET access_count = if_not_exists(access_count, :zero) + :increment, last_accessed = :lastAccessed",
        ExpressionAttributeValues: {
          ":increment": 1,
          ":zero": 0,
          ":lastAccessed": new Date().toISOString(),
        },
        ReturnValues: "UPDATED_NEW" as const,
      };

      try {
        await docClient.send(new UpdateCommand(metricsParams));
        console.log(`Metrics updated for identifier: ${req.params.identifier}`);
      } catch (metricsError) {
        console.error('Error updating metrics:', metricsError);
      }

      return res.redirect(302, original_url);
    } else {
      res
        .status(404)
        .json({ error: 'Could not find short URL with the given identifier' });
      return;
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Could not retrieve short URL' });
    return;
  }
});

app.use((req, res, next) => {
  res.status(404).json({
    error: "Not Found",
  });
  return
});

export const handler = serverless(app);
