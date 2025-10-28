import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { connectToDB } from "./connect.js";
import URL from "./models/url.js";

import * as urlRouteImport from "./routes/url.js";
import * as staticRouteImport from "./routes/staticRouter.js";

const urlRoute = urlRouteImport.default || urlRouteImport;
const staticRoute = staticRouteImport.default || staticRouteImport;


let dirname;

try {
  // Works in ESM (local)
  const filename = fileURLToPath(import.meta.url);
  dirname = path.dirname(filename);
} catch {
  // Fallback for Netlify’s CommonJS environment
  dirname = path.resolve();
}

dotenv.config();

const app = express();

// mongodb connection
connectToDB(process.env.MONGODB_URL)
  .then(() => {
    console.log("MongoDB connected!!!");
  })
  .catch((err) => console.error("MongoDB connection error:", err));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ejs setup
app.set("view engine", "ejs");
app.set("views", path.resolve(dirname, "views"));

// routes
app.use("/", staticRoute);
app.use("/url", urlRoute);
app.get("/:shortId", async (req, res) => {
  const shortId = req.params.shortId;

  const entry = await URL.findOneAndUpdate(
    { shortId },
    {
      $push: {
        visitHistory: {
          timestamp: Date.now(),
        },
      },
    },
    { new: true }
  );

  if (!entry) {
    return res.status(404).send("URL not found");
  }
  res.redirect(entry.redirectURL);
});

if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 8000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

export default app;
