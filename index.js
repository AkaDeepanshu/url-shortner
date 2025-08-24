import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import urlRoute from "./routes/url.js";
import statisRoute from "./routes/staticRouter.js";
import { connectToDB } from "./connect.js";
import URL from "./models/url.js";

// ES modules don't have __dirname, so we need to create it
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
app.set("views", path.resolve(__dirname, "views"));

// routes
app.use("/", statisRoute);
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

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server started at Port: ${PORT}`);
});

export default app;