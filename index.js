import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { connectToDB } from "./connect.js";
import URL from "./models/url.js";

dotenv.config();

const app = express();

/* -------------------------------------------------------------
   Resolve dirname safely (works both locally and on Netlify)
------------------------------------------------------------- */
let dirname;
try {
  const filename = fileURLToPath(import.meta.url);
  dirname = path.dirname(filename);
} catch {
  dirname = path.resolve();
}

/* -------------------------------------------------------------
   Middleware setup
------------------------------------------------------------- */
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// EJS setup
app.set("view engine", "ejs");
app.set("views", path.resolve(dirname, "views"));

/* -------------------------------------------------------------
   Connect to MongoDB
------------------------------------------------------------- */
await connectToDB(process.env.MONGODB_URL)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

/* -------------------------------------------------------------
   Build a ready-to-use app
------------------------------------------------------------- */
export async function createApp() {
  const { default: urlRoute } = await import("./routes/url.js");
  const { default: staticRoute } = await import("./routes/staticRouter.js");

  app.use("/", staticRoute);
  app.use("/url", urlRoute);

  app.get("/:shortId", async (req, res) => {
    const shortId = req.params.shortId;
    try {
      const entry = await URL.findOneAndUpdate(
        { shortId },
        { $push: { visitHistory: { timestamp: Date.now() } } },
        { new: true }
      );

      if (!entry) return res.status(404).send("URL not found");
      res.redirect(entry.redirectURL);
    } catch (err) {
      console.error(err);
      res.status(500).send("Server error");
    }
  });

  return app;
}

/* -------------------------------------------------------------
   Local dev server (won’t run on Netlify)
------------------------------------------------------------- */
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 8000;
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}
