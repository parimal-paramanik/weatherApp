


const express = require("express")
const {connection}=  require("./config/db")
const {UserRoutes} = require("./router/router")
const app = express()
const logger=require("./winston")
app.use(express.json())
const bodyParser=require("body-parser")
app.use(bodyParser.urlencoded({extended:true}))
const http=require("http")
const { authenticator } = require("./authenticatemiddle/authenticate")


app.get("/",(req,res)=>{
    res.sendFile(__dirname + "/index.html")
})




app.use("/user",UserRoutes)


app.listen(process.env.port, async () => {
    try {
        await connection
        console.log("connected to atlas")
    } catch (error) {
        console.log(error)
    }
    console.log(`server is awake at  ${process.env.port}`)
})