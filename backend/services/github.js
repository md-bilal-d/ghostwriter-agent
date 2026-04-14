const { Octokit } = require('@octokit/rest');
require('dotenv').config();

class GithubService {
    constructor() {
        this.octokit = new Octokit({
            auth: process.env.GITHUB_TOKEN
        });
    }

    /**
     * Adds a review comment to the PR indicating the agent is looking at it.
     */
    async notifyPRStarted(owner, repo, prNumber) {
        try {
            await this.octokit.issues.createComment({
                owner,
                repo,
                issue_number: prNumber,
                body: `🤖 **Ghostwriter Agent** has detected a pipeline failure on this PR.\nI am spinning up a sandbox environment to analyze the logs and attempt a self-healing fix. You can monitor my progress on the Ghostwriter Dashboard.`
            });
        } catch (error) {
            console.error("[Github] Failed to comment on PR:", error.message);
        }
    }

    /**
     * Gets details about a PR
     */
    async getPRDetails(owner, repo, prNumber) {
        const { data } = await this.octokit.pulls.get({
            owner,
            repo,
            pull_number: prNumber
        });
        return data;
    }

    // Final PR push logic will go here
}

module.exports = new GithubService();
