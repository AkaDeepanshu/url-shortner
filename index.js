const express  = require('express');
const path = require('path')
const urlRoute = require('./routes/url')
const statisRoute = require("./routes/staticRouter")
const { connectToDB } = require('./connect');
const URL = require('./models/url');
require('dotenv').config();

const app = express();
const PORT = 8000;

// mongodb connection
connectToDB(process.env.MONGODB_URL).then(()=>{
    console.log("MongoDB connected!!!");
});
app.use(express.json());
app.use(express.urlencoded({extended:false}));

// ejs setup
app.set("view engine","ejs")
app.set("views",path.resolve("./views"))

// routes
app.use('/',statisRoute);
app.use("/url",urlRoute);
app.get("/:shortId",async (req,res)=>{
    const shortId = req.params.shortId;

    const entry = await URL.findOneAndUpdate({shortId},{
        $push:{
            visitHistory:{
                timestamp:Date.now()
            }
        }
    },{new:true});

    res.redirect(entry.redirectURL);
})


app.listen(PORT , ()=>{
    console.log(`Server started at Port: ${PORT}`);
})
