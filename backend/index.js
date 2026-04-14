require('dotenv').config({ path: '../.env' });
const express = require('express');
const { GoogleGenAI } = require('@google/genai');
const { Octokit } = require('@octokit/rest');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

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

io.on('connection', (socket) => {
    console.log(`📡 Dashboard Connected: ${socket.id}`);
    socket.on('disconnect', () => console.log(`📡 Dashboard Disconnected: ${socket.id}`));
});
app.use(express.json());

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

app.post('/github-webhook', async (req, res) => {
    const event = req.headers['x-github-event'];
    const payload = req.body;

    if (event === 'pull_request' && (payload.action === 'opened' || payload.action === 'synchronize')) {
        const owner = payload.repository.owner.login;
        const repo = payload.repository.name;
        const pull_number = payload.pull_request.number;

        // Get the IO instance to broadcast logs
        const io = req.app.get('io');
        const broadcast = (msg) => {
            console.log(msg);
            // The dashboard expects an 'agent_log' event with text
            io.emit('agent_log', { text: msg });
        };

        broadcast(`🤖 Analyzing PR #${pull_number} in ${repo}...`);

        try {
            broadcast(`🔍 Fetching code diffs for PR #${pull_number}...`);
            // 1. Get the code changes (the "diff")
            const { data: diff } = await octokit.pulls.get({
                owner, repo, pull_number,
                mediaType: { format: 'diff' }
            });

            broadcast(`🧠 Sending changes to Google Gemini 2.5 Flash for review...`);
            // 2. Ask Gemini to review the code
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `You are a Senior Software Engineer. Review the following GitHub code diff for bugs, security issues, and clean code violations. Be concise and constructive.\n\nHere is the diff:\n\n${diff}`
            });

            const review = response.text;
            broadcast(`✍️ Drafting engineering review comment...`);

            // 3. Post the review as a comment on GitHub
            await octokit.issues.createComment({
                owner, repo, issue_number: pull_number,
                body: `### 🤖 Ghostwriter AI Review\n\n${review}`
            });

            broadcast(`✅ Review posted successfully to GitHub! Waiting for next event...`);
        } catch (error) {
            broadcast(`❌ Critical Error: ${error.message}`);
        }
    }
    res.status(200).send('Processed');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => console.log(`🚀 Agent is live on port ${PORT}`));
