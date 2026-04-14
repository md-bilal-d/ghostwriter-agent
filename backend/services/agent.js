const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const sandbox = require('./sandbox');
const github = require('./github');
const Mission = require('../models/Mission');

class AgentService {
    constructor() {
        this.maxIterations = 3;
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    }

    /**
     * Main entry point when a PR is triggered
     */
    async processPR(missionId, owner, repo, prNumber, branch, emitLog) {
        let mission;
        try {
            mission = await Mission.findById(missionId);
            if (!mission) throw new Error("Mission record not found");

            mission.status = 'in_progress';
            await mission.save();

            emitLog(`[Agent] Initializing mission for ${owner}/${repo} PR #${prNumber}`);

            // 1. Notify GitHub PR
            await github.notifyPRStarted(owner, repo, prNumber);

            // 2. Prepare Workspace (Clone)
            emitLog(`[Agent] Cloning repository for analysis...`);
            const { missionId: workspaceId, workspacePath } = await sandbox.prepareWorkspace(`${owner}/${repo}`, branch);
            
            // 3. Initial Test Run in Docker
            mission.status = 'testing';
            await mission.save();

            emitLog(`[Agent] Running initial tests in isolated sandbox...`);
            const initialResult = await sandbox.runTests(workspaceId, emitLog);

            mission.logs.push(initialResult.logs);
            await mission.save();

            if (initialResult.success) {
                emitLog(`[Agent] Core tests passed on first try. No healing required.`);
                mission.status = 'skipped';
                await mission.save();
                await sandbox.cleanupWorkspace(workspaceId);
                return;
            }

            // 4. Tests Failed - Enter Think-Act-Verify Loop
            emitLog(`[Agent] ⚠️ Tests failed. Root cause analysis initiated...`);
            let isFixed = false;
            let iterations = 0;

            while (!isFixed && iterations < this.maxIterations) {
                iterations++;
                emitLog(`[Agent] --- Healing Iteration ${iterations} of ${this.maxIterations} ---`);

                mission.status = 'analyzing';
                await mission.save();

                // Think: Analyze logs
                const proposedFix = await this.analyzeLogsAndProposeFix(initialResult.logs, owner, repo, workspacePath, emitLog);

                if (!proposedFix || !proposedFix.file) {
                    emitLog(`[Agent] Could not determine a high-confidence fix.`);
                    break;
                }

                // Act: Apply Fix
                emitLog(`[Agent] Applying AI-propose fix to: ${proposedFix.file}`);
                this.applyFix(workspacePath, proposedFix.file, proposedFix.newContent);

                // Verify: Re-run tests
                mission.status = 'testing';
                await mission.save();

                emitLog(`[Agent] Re-running tests to verify fix...`);
                const verifyResult = await sandbox.runTests(workspaceId, emitLog);

                if (verifyResult.success) {
                    emitLog(`[Agent] ✅ Tests passed! Fix validated successfully.`);
                    isFixed = true;
                    mission.aiReasoning = proposedFix.reasoning;
                } else {
                    emitLog(`[Agent] ❌ Fix failed to resolve the issue. Retrying...`);
                }
            }

            // 5. Commit Fix or Abandon
            if (isFixed) {
                emitLog(`[Agent] Preparing to push self-healing commit to GitHub...`);
                
                await github.commitFix(owner, repo, branch, proposedFix.file, proposedFix.newContent);
                await github.notifyFixSuccess(owner, repo, prNumber, proposedFix.reasoning);

                mission.status = 'success';
                emitLog(`[Agent] ✅ Fix pushed and PR notified.`);
            } else {
                emitLog(`[Agent] Failure: Could not resolve the test failure within bounds.`);
                mission.status = 'failed';
            }

            await mission.save();
            await sandbox.cleanupWorkspace(workspaceId);
            emitLog(`[Agent] Mission complete.`);

        } catch (error) {
            console.error(error);
            if (typeof emitLog === 'function') emitLog(`[Error] Agent fatal error: ${error.message}`);
            if (mission) {
                mission.status = 'failed';
                await mission.save();
            }
        }
    }

    /**
     * Real LLM Integration with Gemini 1.5 Pro
     */
    async analyzeLogsAndProposeFix(logs, owner, repo, workspacePath, emitLog) {
        emitLog(`[LLM] Consulting Gemini 1.5 Pro for architectural analysis...`);

        const prompt = `
            You are Ghostwriter, an autonomous self-healing software agent.
            A CI/CD pipeline failed for the repository ${owner}/${repo}.
            
            FAILURE LOGS:
            ---
            ${logs.substring(0, 10000)} 
            ---

            YOUR TASK:
            1. Analyze the logs to find the root cause (typo, missing import, logic error, etc.).
            2. Identify the single most relevant file that needs fixing.
            3. Provide the full replacement content for that file.

            OUTPUT FORMAT (Strict JSON):
            {
                "reasoning": "Brief explanation of what was wrong",
                "file": "path/to/file.js",
                "newContent": "FULL FILE CONTENT HERE"
            }
            
            Only return the JSON. No markdown backticks.
        `;

        try {
            const result = await this.model.generateContent(prompt);
            const responseText = result.response.text().trim();
            // Basic JSON cleaning if LLM adds markdown
            const cleanJson = responseText.replace(/```json|```/g, '');
            return JSON.parse(cleanJson);
        } catch (error) {
            emitLog(`[LLM Error] AI Reasoning failed: ${error.message}`);
            return null;
        }
    }

    applyFix(workspacePath, relativeFilePath, newContent) {
        const absolutePath = path.join(workspacePath, relativeFilePath);
        // Security check
        if (!absolutePath.startsWith(path.resolve(workspacePath))) {
            throw new Error("Security Violation: Attempted path traversal out of sandbox");
        }

        // Ensure directories exist
        fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
        fs.writeFileSync(absolutePath, newContent, 'utf-8');
    }
}

module.exports = new AgentService();
