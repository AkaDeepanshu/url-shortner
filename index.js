import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { connectToDB } from "./connect.js";
import URL from "./models/url.js";

dotenv.config();

/* -------------------------------------------------------------
   Create Express app
------------------------------------------------------------- */
const app = express();

/* -------------------------------------------------------------
   Resolve dirname safely (works both locally & on Netlify)
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
   Function to create & return a ready Express app
------------------------------------------------------------- */
export async function createApp() {
  // Connect to MongoDB inside this async function (not top-level)
  try {
    await connectToDB(process.env.MONGODB_URL);
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
  }

  // Dynamic imports for routes (avoids early CJS bundling issues)
  const { default: urlRoute } = await import("./routes/url.js");
  const { default: staticRoute } = await import("./routes/staticRouter.js");

  // Routes setup
  app.use("/", staticRoute);
  app.use("/url", urlRoute);

  // Redirect handler for short URLs
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
      console.error("Redirect error:", err);
      res.status(500).send("Server error");
    }
  });

  return app;
}

/* -------------------------------------------------------------
   Local dev server (skipped on Netlify)
------------------------------------------------------------- */
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 8000;
  connectToDB(process.env.MONGODB_URL)
    .then(() => {
      app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
    })
    .catch((err) => console.error("MongoDB connection error:", err));
}
