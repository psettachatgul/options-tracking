import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import axios from 'axios';
import { track } from './track';
import { auth, refreshAccessToken } from './auth';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

app.get("/oauth_code", async (req: Request, res: Response) => {
  console.log('******************** req.body, ', req.body);
  console.log('******************** req.query, ', req.query);

  if (req.query.code) {

    const formData = new URLSearchParams();
    formData.append('grant_type', 'authorization_code');
    formData.append('client_id', process.env.CS_CLIENT_ID!);
    formData.append('code', req.query.code.toString());
    formData.append('redirect_uri', process.env.AUTHCODE_REDIRECT_URL!);

    try {
      const { data: tokenResponse } = await axios.post(
        process.env.CS_TOKEN_URL!,
        formData,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization':
              `Basic ${Buffer.from(`${process.env.CS_CLIENT_ID}:${process.env.CS_CLIENT_SECRET}`).toString('base64')}`
          }
        }
      );

      console.log('*************** tokenResponse, ', tokenResponse);
      const html = Object.entries(tokenResponse).reduce<string>(
        (_html, [key, value]) => {

          _html += `<p>${key}: ${value} <button onclick="(function(){navigator.clipboard.writeText('${value}');})()">copy</button></p>`
          return _html;
        },
        ''
      );

      auth.refresh_token = tokenResponse.refresh_token;
      await refreshAccessToken();
      track();

      res.send(`<html><body>${html}</body></html>`);
      return;

    } catch (ex) {
      console.error(ex);
      throw ex;
    }

  }

  res.send("check logs");
});

app.get("/", async (req: Request, res: Response) => {

  res.send(`<html><body><a target="_blank" rel="noopener noreferrer" href="${process.env.CS_AUTHORIZATION_URL}">login</a></body></html>`);

});

app.listen(port, async () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);

  await refreshAccessToken();
  track();

});