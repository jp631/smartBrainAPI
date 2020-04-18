const express = require("express");
const bcrypt = require("bcrypt-nodejs");
const cors = require("cors");
const knex = require("knex");
const register = require("./register")
const  clarifai = require('clarifai');
//process.env.MODE_ITS_REJECT_UNAUTHORIZED = 0;

let PORT = process.env.PORT;
const app = express();
 app.use(express.json());
 app.use(cors());

 const appClarifai = new clarifai.App({
  apiKey: 'e7c6ed6030c54d9d8fad78b455fa8d12'
 });

   const db = knex({
   client: 'pg',
   connection: {
    connectionString : process.env.DATABASE_URL,
    ssl: true
   }
 });

 db.select('*').from('users').then(data => {
   console.log(data);
 });

app.get("/", (req, res) => {
  res.json("loading");
})

app.post("/signIn", (req, res) => {
  const {email, password} = req.body;
  if(!email, !password){
    return res.status(400).json("incorect form submition!")
  }
  db.select("email", "hash").from("login")
    .where("email", "=", email)
    .then(data => {
        const isValid = bcrypt.compareSync(password, data[0].hash);
        if(isValid){
          return db.select("*").from("users")
              .where("email", "=", email)
              .then(user => {
                res.json(user[0]);
              })
              .catch(err => {
                res.status(400).json("Unable to get user!")
              })
        }else{
          res.status(400).json("Incorrect password or email!")
        }
      })
      .catch(err => {
        res.status(400).json("Incorrect password or email!")
      })
    })

app.post("/register", (req, res) => {register.handleRegister(req, res, db, bcrypt)});

app.get("/profile/:id", (req, res) => {
  const { id } = req.params;
db.select("*").from("users").where({
  id: id
})
.then(user => {
  if(user.length){
    res.json(user[0]);
  }else{
    res.status(400).json("Not Found")
  }
})
.catch(err => res.status(400).json("error getting users"))
})
/////
app.post("/imageURL", (req, res) => {
    appClarifai.models.predict(Clarifai.FACE_DETECT_MODEL, req.body.input)
    .then(data => {
      res.json(data)
    })
    .catch(err => {
      res.status(400).json("unable to work with API")
    })
})

app.put("/image", (req, res) => {
  const { id } = req.body;
db("users").where("id", "=", id)
.increment("entries", 1)
.returning("entries")
.then(entries => {
  res.json(entries[0]);
})
.catch(err => res.status(400).json("Unable to get entries"))
})
///////

if(PORT == null || PORT == ""){
  PORT = 8000
}
app.listen(PORT || 3000, () => {
  console.log(`app is running on port ${PORT}`);
})
