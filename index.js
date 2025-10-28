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
connectToDB(process.env.MONGODB_URL)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

/* -------------------------------------------------------------
   Dynamic route import (fixes Netlify bundling issues)
------------------------------------------------------------- */
(async () => {
  try {
    const { default: urlRoute } = await import("./routes/url.js");
    const { default: staticRoute } = await import("./routes/staticRouter.js");

    // Register routes only after dynamic import succeeds
    app.use("/", staticRoute);
    app.use("/url", urlRoute);

    // Short ID redirect route
    app.get("/:shortId", async (req, res) => {
      const shortId = req.params.shortId;

      try {
        const entry = await URL.findOneAndUpdate(
          { shortId },
          { $push: { visitHistory: { timestamp: Date.now() } } },
          { new: true }
        );

        if (!entry) {
          return res.status(404).send("URL not found");
        }

        res.redirect(entry.redirectURL);
      } catch (error) {
        console.error("Redirect error:", error);
        res.status(500).send("Internal Server Error");
      }
    });

    // Only start the server locally (Netlify uses the handler)
    if (process.env.NODE_ENV !== "production") {
      const PORT = process.env.PORT || 8000;
      app.listen(PORT, () =>
        console.log(`🚀 Server running locally on port ${PORT}`)
      );
    }
  } catch (err) {
    console.error("Route import error:", err);
  }
})();

/* -------------------------------------------------------------
   Export app for Netlify handler
------------------------------------------------------------- */
export default app;
