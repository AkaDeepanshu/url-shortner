import serverless from "serverless-http";
import { createApp } from "../../index.js";

let cachedHandler;

export const handler = async (event, context) => {
  if (!cachedHandler) {
    const app = await createApp(); // wait until Express app is fully ready
    cachedHandler = serverless(app);
  }

  return cachedHandler(event, context);
};
