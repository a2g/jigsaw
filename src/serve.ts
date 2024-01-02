import dotenv from 'dotenv'
// import { createClient, RedisClient } from 'redis';
import responseTime from 'response-time'
import cors from 'cors'
import path from 'path'

import express from 'express'
import {
  getJsonOfAllSolutionsApi,
  getJsonOfStartersApi,
  getSvgApi
} from './api/api'
const app = express()
const PORT = (process.env.PORT != null) ? `${process.env.PORT}` : 5000
/*
const redisClient: RedisClient = createClient({
  url: process.env.REDIS_ENDPOINT_URI,
  password: process.env.REDIS_PASSWORD,
}); */

dotenv.config()

app.use('/', express.static(path.join(__dirname, '../lib/src')))
app.use(responseTime())
app.use(
  cors({
    exposedHeaders: ['X-Response-Time']
  })
)
/*
function getSolutionsFromRedis(
  req: Request,
  responseSender: Response,
  next: NextFunction
) {
  next();

  const { username } = req.params;

  redisClient.get(username, (err, data) => {
    if (err) throw err;

    if (data !== null) {
      responseSender.jsonc(username);
    } else {
      next();
    }
  });
}
*/
// app.get('/solutions/:firstFile', getSolutionsFromRedis, getSolutionsDirect);
app.get('/puz/:repo/:world/:area/sols', getJsonOfAllSolutionsApi)
app.get('/puz/:repo/:world/:area/svg', getSvgApi)
app.get('/puz/starters', getJsonOfStartersApi)

app.listen(PORT, () => {
  console.log(
    `Congratulations, the backend server has started. It's listening on ${PORT}`
  )
  console.log('Some example calls:')
  console.log(`http://localhost:${PORT}/puz/exclusive-worlds/Satanic/01/sols`)
  console.log(
    `http://localhost:${PORT}/puz/puzzle-pieces/practice-world/03/sols`
  )
})

module.exports = app
