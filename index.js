const { createRequire } = require('node:module');
require = createRequire(__filename); 
const express = require('express')
const app = express()
const port = 3000

const LTASolverV2 = require("./lib/LTASolverV2");

app.use(express.json());

app.get('/', (req, res) => {
  res.send('OK')
})

app.post('/solve', LTASolverV2.getCar);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})