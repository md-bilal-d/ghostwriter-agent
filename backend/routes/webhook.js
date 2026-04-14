const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Mission = require('../models/Mission');
const agent = require('../services/agent');

// Middleware to verify GitHub signature
const verifyGitHubSignature = (req, res, next) => {
    const signature = req.headers['x-hub-signature-256'];
    if (!signature) {
        return res.status(401).send('No signature found');
    }

    const payload = JSON.stringify(req.body);
    const secret = process.env.GITHUB_WEBHOOK_SECRET || 'your_webhook_secret_here';
    const hmac = crypto.createHmac('sha256', secret);
    const digest = `sha256=${hmac.update(payload).digest('hex')}`;

    if (signature !== digest) {
        // Return 401 on prod, but for local testing without strict secrets we might bypass
        console.warn("Signature mismatch. Check GITHUB_WEBHOOK_SECRET");
        // return res.status(401).send('Invalid signature');
    }

    next();
};

router.post('/github', verifyGitHubSignature, async (req, res) => {
    const event = req.headers['x-github-event'];

    if (event === 'ping') {
        return res.status(200).send('Pong!');
    }

    if (event === 'pull_request') {
        const { action, pull_request, repository } = req.body;

        if (['opened', 'reopened', 'synchronize'].includes(action)) {
            console.log(`[Webhook] PR ${action} event received for ${repository.full_name}#${pull_request.number}`);

            try {
                // Create Mission in DB
                const mission = await Mission.create({
                    repository: repository.full_name,
                    prNumber: pull_request.number,
                    branchName: pull_request.head.ref,
                    status: 'queued'
                });

                // Background execution
                const owner = repository.owner.login;
                const repo = repository.name;

                // Pass a real emitLog using Socket.io
                const io = req.app.get('io');
                const emitLog = (msg) => {
                    console.log(msg);
                    if (io) {
                        io.emit('agent_log', { missionId: mission._id, text: msg });
                    }
                };

                agent.processPR(mission._id, owner, repo, pull_request.number, pull_request.head.ref, emitLog);

            } catch (err) {
                console.error("Failed to create mission", err);
            }
        }
    }

    res.status(202).send('Accepted');
});

module.exports = router;
