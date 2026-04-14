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
     * Commits a fix to a branch.
     * For the MVP, we assume we can push directly to the PR branch or we create a new one.
     */
    async commitFix(owner, repo, branch, filePath, content, message = "chore: ghostwriter self-healing fix") {
        try {
            // 1. Get the current commit SHA of the branch
            const { data: refData } = await this.octokit.git.getRef({
                owner, repo, ref: `heads/${branch}`
            });
            const baseSha = refData.object.sha;

            // 2. Get the tree of the base commit
            const { data: commitData } = await this.octokit.git.getCommit({
                owner, repo, commit_sha: baseSha
            });
            const baseTreeSha = commitData.tree.sha;

            // 3. Create a new blob for the fixed file
            const { data: blobData } = await this.octokit.git.createBlob({
                owner, repo, content, encoding: 'utf-8'
            });

            // 4. Create a new tree with the new blob
            const { data: treeData } = await this.octokit.git.createTree({
                owner, repo,
                base_tree: baseTreeSha,
                tree: [
                    {
                        path: filePath,
                        mode: '100644',
                        type: 'blob',
                        sha: blobData.sha
                    }
                ]
            });

            // 5. Create the commit
            const { data: newCommitData } = await this.octokit.git.createCommit({
                owner, repo,
                message,
                tree: treeData.sha,
                parents: [baseSha]
            });

            // 6. Update the branch reference
            await this.octokit.git.updateRef({
                owner, repo,
                ref: `heads/${branch}`,
                sha: newCommitData.sha
            });

            return { success: true, sha: newCommitData.sha };
        } catch (error) {
            console.error("[Github] Failed to commit fix:", error.message);
            throw error;
        }
    }

    /**
     * Posts a final summary of the fix to the PR.
     */
    async notifyFixSuccess(owner, repo, prNumber, reasoning) {
        await this.octokit.issues.createComment({
            owner, repo, issue_number: prNumber,
            body: `✅ **Ghostwriter Success!**\n\nI have successfully applied a fix to resolve the test failures.\n\n**AI Reasoning:**\n${reasoning}`
        });
    }
}

module.exports = new GithubService();
