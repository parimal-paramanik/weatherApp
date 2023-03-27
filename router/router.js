const bcrypt = require("bcrypt")
const { json } = require("express")
const express = require("express")
const jwt = require("jsonwebtoken")
const UserRoutes = express.Router()
const { userModel } = require("../model/model")
const fs=require("fs")

const bodyParser=require("body-parser")
UserRoutes.use(bodyParser.urlencoded({extended:true}))

const {authenticator}=require("../authenticatemiddle/authenticate")

const http=require("http")
//signup here
UserRoutes.post("/signup", async (req, res) => {

  try {
    const { email, password, name} = req.body
     const ExistedUser= await userModel.findOne({email})

     if(ExistedUser){
      return  res.send("user is already signed in ")
      
     }

    bcrypt.hash(password, 5, async (err, hash) => {
      if (err) {
        res.send(err.message)
      }

      const user = new userModel({ name, email, password: hash })
       await user.save()
      res.send("New user is registered succesfully")
      
    })

  } catch (err) {
    res.send({ error: err.message })
  }
})

//login with hasing and two token
UserRoutes.post("/login", async (req, res) => {
  const { email, password } = (req.body)
  try {
    const user = await userModel.find({ email })
    // console.log(user)
    if (user) {
      bcrypt.compare(password, user[0].password, (error, result) => {
        if (result) {
          let token = jwt.sign({ userId: user._id }, process.env.SECRETKEY, {expiresIn:"50s"})
          let  refreshToken = jwt.sign({ userId: user._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '5m' });

          res.send({ "msg": "login successfull", "token": token ,"refresh_token":refreshToken})
        } else {
          res.send("Wrong data")
        }
      })
    }else{
      res.send("please signup first")
    }
  } catch (error) {
    res.send(error)
  }
})


//get a new normal token from refresh token

 UserRoutes.post("/refresh",async(req,res)=>{
  // const user = await userModel.find({ email })
  const refreshToken=req.headers.authorization.split(' ')[1]
  const BlacklistData = JSON.parse(fs.readFileSync("./black.json","utf-8"))

  if (!refreshToken || BlacklistData.includes(refreshToken)){
    res.send( {msg:"please login first"})
  }
   jwt.verify(refreshToken,process.env.REFRESH_TOKEN_SECRET,(err,decoded)=>{
    if(err){
      res.send("please login first")
    }else{
      const token = jwt.sign({ userId: decoded.userId}, process.env.SECRETKEY, {expiresIn:"10s"})

       res.send({msg:"login succesfull","token":token})
    }
   })
})

//creating a simple blog page get request

//https://api.openweathermap.org/data/2.5/weather?q={city name}&appid=1f4967826d014872380ac48717037907&units=metric

UserRoutes.post("/", authenticator,(req,res)=>{

  const querry=req.body.cityName
  const apiKey='1f4967826d014872380ac48717037907'
  const url='https://api.openweathermap.org/data/2.5/weather?q='+ querry+ '&appid='+apiKey+'&units=metric'
  http.get=(url,(response)=>{
   response.on("data",(data)=>{
     const WeatherData=JSON.parse(data)
     const temp=WeatherData.main.temp
     const desc=WeatherData.weather[0].desc
   
     res.write('the temp in' + querry+ "is" + temp +'degree celcius')
     res.write('the weather in' + querry+ "for today is " + desc )
   
    })
  })
   
 })





//loging out method with authentication and blacklisting
UserRoutes.get("/logout",(req,res)=>{
  
  const token=req.headers.authorization.split(' ')[1]

  try {
    if(token){
      const file=JSON.parse(
        fs.readFileSync("./black.json","utf-8")
        
      );
      console.log(file)
      file.push(token)
     fs.writeFileSync("./black.json",JSON.stringify(file))
     console.log(file)
     res.send("logout succesfull")
    }
  } catch (error) {
    res.send(error)
  }
})


module.exports = {
  UserRoutes
}