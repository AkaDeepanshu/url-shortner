import express from "express";

const router = express.Router();

router.get('/', (req, res) => {
    return res.render("home", {
        clientUrl: process.env.CLIENT_URL
    });
});

export default router;