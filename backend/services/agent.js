const fs = require('fs');
const path = require('path');
const sandbox = require('./sandbox');
const github = require('./github');
const Mission = require('../models/Mission');

// Placeholder for LLM import. Depending on the API key provided, we can use OpenAI or Google GenAI.
// We'll use a generic interface here for the MVP.

class AgentService {
    constructor() {
        this.maxIterations = 3;
    }

    /**
     * Main entry point when a PR is triggered
     */
    async processPR(missionId, owner, repo, prNumber, branch, emitLog) {
        let mission;
        try {
            mission = await Mission.findById(missionId);
            mission.status = 'in_progress';
            await mission.save();

            emitLog(`[Agent] Initializing mission ${missionId} for ${owner}/${repo} PR #${prNumber}`);

            // Optional: notify via PR comment
            await github.notifyPRStarted(owner, repo, prNumber);

            // 1. Prepare Workspace (Clone)
            emitLog(`[Agent] Preparing isolated workspace on host...`);
            const { missionId: workspaceId, workspacePath } = await sandbox.prepareWorkspace(`${owner}/${repo}`, branch);
            emitLog(`[Agent] Workspace ${workspaceId} ready at ${workspacePath}`);

            // 2. Initial Test Run in Docker
            mission.status = 'testing';
            await mission.save();

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

            // 3. Tests Failed - Enter Think-Act-Verify Loop
            emitLog(`[Agent] Tests failed. Entering self-healing loop...`);
            mission.status = 'analyzing';
            await mission.save();

            let isFixed = false;
            let iterations = 0;

            while (!isFixed && iterations < this.maxIterations) {
                iterations++;
                emitLog(`[Agent] --- Iteration ${iterations} ---`);

                // Think: Analyze logs
                const proposedFix = await this.analyzeLogsAndProposeFix(initialResult.logs, workspacePath, emitLog);

                if (!proposedFix || !proposedFix.file) {
                    emitLog(`[Agent] Could not determine a fix.`);
                    break;
                }

                // Act: Apply Fix
                emitLog(`[Agent] Applying fix to ${proposedFix.file}`);
                this.applyFix(workspacePath, proposedFix.file, proposedFix.newContent);

                // Verify: Re-run tests
                mission.status = 'testing';
                await mission.save();

                const verifyResult = await sandbox.runTests(workspaceId, emitLog);

                if (verifyResult.success) {
                    emitLog(`[Agent] Tests passed! Fix validated.`);
                    isFixed = true;
                    mission.aiReasoning = proposedFix.reasoning;
                } else {
                    emitLog(`[Agent] Fix failed. Test still failing.`);
                }
            }

            // 4. Push or Fail
            if (isFixed) {
                emitLog(`[Agent] Pushing fix to original PR...`);
                // Actual push logic goes here (mocked for now)
                mission.status = 'success';
            } else {
                emitLog(`[Agent] Max iterations reached or fix indiscernible. Abandoning.`);
                mission.status = 'failed';
            }

            await mission.save();

            // Cleanup
            await sandbox.cleanupWorkspace(workspaceId);
            emitLog(`[Agent] Mission complete.`);

        } catch (error) {
            if (typeof emitLog === 'function') emitLog(`[Error] Agent fatal error: ${error.message}`);
            if (mission) {
                mission.status = 'failed';
                await mission.save();
            }
        }
    }

    /**
     * Mocked LLM Integration
     */
    async analyzeLogsAndProposeFix(logs, workspacePath, emitLog) {
        emitLog(`[LLM] Analyzing ${logs.length} characters of test logs...`);
        // NOTE: In a full version, we initialize GenAI or OpenAI SDK here, send logs, and Agenticly request file contents.

        // Simulating LLM response time
        await new Promise(res => setTimeout(res, 2000));

        // Hardcoded mock fix for demonstration purposes
        return {
            reasoning: "Detected a missing variable declaration causing ReferenceError in the test logs.",
            file: "index.js",
            newContent: "// Fixed by Ghostwriter\nconsole.log('Fixed!');"
        };
    }

    applyFix(workspacePath, relativeFilePath, newContent) {
        const absolutePath = path.join(workspacePath, relativeFilePath);
        if (!absolutePath.startsWith(workspacePath)) throw new Error("Path traversal blocked");

        // Write new content to host (which is mounted to docker)
        fs.writeFileSync(absolutePath, newContent, 'utf-8');
    }
}

module.exports = new AgentService();
