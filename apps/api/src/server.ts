import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { createServer } from 'http'
import { logger } from './lib/logger'
import { authRouter } from './routes/auth'
import { patientRouter } from './routes/patient'
import { clinicRouter } from './routes/clinic'
import { adminRouter } from './routes/admin'
import { errorHandler } from './middleware/errorHandler'
import { startCronJobs } from './jobs/checklist.cron'

const app = express()
const PORT = process.env.PORT || 3001

app.use(helmet())
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', version: '1.0.0', timestamp: new Date().toISOString() })
})

app.use('/api/auth', authRouter)
app.use('/api/patient', patientRouter)
app.use('/api/clinic', clinicRouter)
app.use('/api/admin', adminRouter)

app.use(errorHandler)

const server = createServer(app)

server.listen(PORT, () => {
  logger.info(`🚀 Ápice API running on port ${PORT}`)
  startCronJobs()
})

export default app
