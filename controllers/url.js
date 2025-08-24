// Use dynamic import for nanoid which is an ES module
const URL = require("../models/url");

async function handleGenerateShortURL(req,res){
    try {
        const { nanoid } = await import('nanoid');
        const body = req.body;
        if(!body.url){
        return req.status(400).json({error:"url is required"});
    }

    const shortId = nanoid(8);
    await URL.create({
        shortId,
        redirectURL:body.url,
        visitHistory:[]
    })
    return res.render("home",{
        id:shortId,
        clientUrl: process.env.CLIENT_URL
    });
    } catch (error) {
        console.error("Error generating short URL:", error);
        return res.status(500).json({ error: "Failed to generate short URL" });
    }
}

async function handleGetUrlAnalytics(req,res){
    try {
        const shortId = req.params.shortId;
        const result = await URL.findOne({shortId});
        if (!result) {
            return res.status(404).json({ error: "Short URL not found" });
        }
        return res.json({
            totalClicks: result.visitHistory.length,
            analytics: result.visitHistory
        });
    } catch (error) {
        console.error("Error getting URL analytics:", error);
        return res.status(500).json({ error: "Failed to get URL analytics" });
    }
}

module.exports = {
    handleGenerateShortURL,
    handleGetUrlAnalytics
}