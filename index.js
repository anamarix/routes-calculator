const express = require("express");
require("dotenv").config()
const app = express();
const Route = require("./my-models/coordinates")
const mongoose = require("mongoose");

const apiKey =process.env.API_KEY;
const dbURL =`mongodb+srv://ania:${apiKey}@clustermap.v8nat.mongodb.net/map?retryWrites=true&w=majority`;
mongoose
.connect(dbURL, { useNewUrlParser: true, useUnifiedTopology: true })
.then(() => console.log("connected to db"));

app.listen(3000, () => console.log("Listening to port 3000"));
app.use(express.static(__dirname + "/my-public"));

app.use(express.json());

app.get("/all", (req, res)=> {
  Route.find({})
  .then(result=> 
    res.send(result))
  .catch(err => console.log(err))
})
app.get("/single-route/:id", (req, res) => {
 const id= req.params.id;

 Route.findById(id)
 .then(result => res.send(result))
 .catch(err => console.log(err))
});

app.post("/", (req, res) => {
  const data = req.body;
  const { line, summary } = data;
  const route = new Route({
    line: line,
    summary: summary,
  });
  route.save()
  .then(() => console.log("saved"))
  .catch(err => console.log("Error ocurred"))
});

