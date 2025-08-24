const { nanoid } = require("nanoid");
const URL = require("../models/url");

async function handleGenerateShortURL(req,res){
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
    })
    
}

async function handleGetUrlAnalytics(req,res){
    const shortId = req.params.shortId;
    const result =await URL.findOne({shortId});
    return res.json({
        totalClicks:result.visitHistory.length,
        analytics:result.visitHistory
    })
}

module.exports = {
    handleGenerateShortURL,
    handleGetUrlAnalytics
}