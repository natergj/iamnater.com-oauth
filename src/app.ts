import fastify from "fastify";
import fastifyCors from 'fastify-cors';

import OpenIdClient from "./openIdClient";

function init() {
  const app = fastify({
    logger: true
  });
  app.register(fastifyCors, {
    origin: (origin, cb) => {
      if(/(^https:\/\/\w*\.?iamnater\.com$)|(^https?:\/\/localhost:\d*$)|(^http:\/\/www\.iamnater\.com\.s3-website\.us-east-2\.amazonaws\.com$)/.test(origin)){
        //  Request from localhost will pass
        cb(null, true)
        return
      }
      cb(new Error("Not allowed"), false)
    }
  })

  app.post("/oauth/exchange-token", async (req, reply) => {
    try {
      const { origin } = new URL(req.headers.referer);
      const tokens = await OpenIdClient.exchangeTokenCode(
        req.body,
        origin,
      );
      reply
        .code(200)
        .header("Content-Type", "application/json; charset=utf-8")
        .send(tokens);
    } catch (e) {
      reply.code(500).send(e);
    }
  });

  app.post("/oauth/refresh-token", async (req, reply) => {
    try {
      const tokens = await OpenIdClient.refreshToken(req.body.refresh_token);
      reply
        .code(200)
        .header("Content-Type", "application/json; charset=utf-8")
        .send(tokens);
    } catch (e) {
      reply.code(500).send(e);
    }
  });
  return app;
}

if (require.main === module) {
  // called directly i.e. "node app"
  const port = parseInt(process.env.SERVER_PORT || '3001', 10);
  init().listen(port, err => {
    if (err) console.error(err);
    console.log(`server listening on ${port}`);
  });
}

export default init;
