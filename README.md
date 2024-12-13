# URL Shortener API 🌐

A simple URL shortener built using **AWS Lambda**, **API Gateway**, and **Serverless Framework** with **Node.js**. The API allows creating short URLs, managing expiration times, and supports both `GET` and `POST` HTTP methods for the shortened URLs.

<div align="center">
   <img src="https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
   <img src="https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white" alt="NodeJS">
   <img src="https://img.shields.io/badge/AWS-%23FF9900.svg?style=for-the-badge&logo=amazon-aws&logoColor=white" alt="AWS">
   <img src="https://img.shields.io/badge/Amazon%20DynamoDB-4053D6?style=for-the-badge&logo=Amazon%20DynamoDB&logoColor=white" alt="Amazon DynamoDB">
</div>

## How to Deploy

1. **Install Dependencies**:

   - Make sure **Node.js** (v16 or higher) and **pnpm** are installed.
   - Run the following commands to install dependencies:

   `pnpm install`

2. **Configure Serverless**:

   - Update the `serverless.yml` with your **AWS region** and **custom domain**.
   - Ensure your **AWS credentials** are configured (via environment variables, AWS CLI, etc.).

3. **Test Locally with `serverless dev`**:

   - You can test your Lambda function locally before deployment using the following command:

   `serverless dev`

   This will start the application locally and simulate the API Gateway and Lambda functions for easier local testing.

4. **Deploy**:

   - Deploy the service using **Serverless Framework**:

   `serverless deploy`

5. **Test the Deployed API**:
   - Once deployed, test the API endpoints using `Postman` or `curl`.
   - The **custom domain** for the API is: [https://api.stra1g.one/](https://api.stra1g.one/).

---

## Features

- **Short URL creation** with custom TTL.
- **Expiration check** for each short URL.
- Supports both **GET** and **POST** methods for shortened URLs.
- **Redirects** for `GET` requests and **POST forwarding** for `POST` requests.

---

## Tech Stack Overview

- **Serverless Framework** for easy deployment and management of Lambda functions.
- **AWS Lambda** for serverless function execution.
- **API Gateway** to expose the Lambda functions as HTTP endpoints.
- **AWS DynamoDB** to store the short URL data.

---

### API Gateway Setup with Custom Domain

1. **Route 53**: Add a CNAME record that points to the **API Gateway URL** (e.g., `your-api-id.execute-api.us-east-1.amazonaws.com`).
2. **ACM (AWS Certificate Manager)**: Issue an SSL certificate for the custom domain (e.g., `api.stra1g.one`).
3. **API Gateway**: Map the custom domain (`api.stra1g.one`) to the API.
4. **Deploy the changes** in **API Gateway** and **Route 53**.

---

Made by **@stra1g** 🖤
