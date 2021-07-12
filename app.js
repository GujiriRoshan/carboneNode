const express = require('express')
require('dotenv').config()
const cors = require('cors')
const app = express()
app.use(cors())
// parse application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: false }));

app.get('/',(req,res)=>{
   res.json({
       message:"doucment generated"
   })
})

// parse application/json
app.use(express.json())

app.use(express.static('assets/'))

const jsforceConnection = require('./jsforceConnection')

const carbone_routes = require('./client/routes/carbone_routes')

app.use(carbone_routes)

const port  =process.env.PORT

app.listen(port,()=>{
    console.log(`app listening on port ${port}`)
})