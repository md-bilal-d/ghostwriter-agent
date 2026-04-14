require('dotenv').config({ path: '../.env' });
const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

// Services & Models
const sandbox = require('./services/sandbox');
const agent = require('./services/agent');
const Mission = require('./models/Mission');

const app = express();
const server = http.createServer(app);

// Use CORS to allow the React frontend on port 5173 to connect
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST']
}));

const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// Expose io to the request object so routes can use it
app.set('io', io);

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Initialize Sandbox (Build Docker Image)
sandbox.initBuilder()
    .then(() => console.log('✅ Sandbox Service Initialized'))
    .catch(err => console.error('❌ Sandbox Initialization Failed:', err));

io.on('connection', (socket) => {
    console.log(`📡 Dashboard Connected: ${socket.id}`);
    socket.on('disconnect', () => console.log(`📡 Dashboard Disconnected: ${socket.id}`));
});

app.use(express.json());

/**
 * GitHub Webhook Route
 * Listens for Pull Request events and triggers the autonomous agent loop.
 */
app.post('/github-webhook', async (req, res) => {
    const event = req.headers['x-github-event'];
    const payload = req.body;

    // Handle PR Opened or Synchronized (new commits)
    if (event === 'pull_request' && (payload.action === 'opened' || payload.action === 'synchronize')) {
        const owner = payload.repository.owner.login;
        const repo = payload.repository.name;
        const prNumber = payload.pull_request.number;
        const branch = payload.pull_request.head.ref;

        const emitLog = (msg) => {
            console.log(`[Webhook] ${msg}`);
            io.emit('agent_log', { text: msg });
        };

        emitLog(`🚀 Webhook Received: PR #${prNumber} (${payload.action})`);

        try {
            // 1. Create a Mission record for observability
            const mission = new Mission({
                repository: `${owner}/${repo}`,
                prNumber,
                branchName: branch,
                status: 'queued'
            });
            await mission.save();

            // 2. Trigger the Agentic Loop in the background (prevent webhook timeout)
            agent.processPR(mission._id, owner, repo, prNumber, branch, emitLog);
            
            res.status(202).json({ message: 'Mission Queued', missionId: mission._id });
        } catch (error) {
            emitLog(`❌ Failed to initialize mission: ${error.message}`);
            res.status(500).json({ error: 'Initialization Failed' });
        }
    } else {
        res.status(200).send('Event Ignored');
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Ghostwriter Agent is live on port ${PORT}`);
    console.log(`🔗 Webhook URL: http://localhost:${PORT}/github-webhook`);
});
