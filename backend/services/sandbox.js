const { exec, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { promisify } = require('util');

const execAsync = promisify(exec);

/**
 * Service to manage Docker containers for isolated repository testing.
 * Mounts a host directory to the container to allow the Node.js Agent to safely edit files
 * while the Docker container executes the untrusted code.
 */
class SandboxService {
    constructor() {
        this.imageName = 'ghostwriter-sandbox:latest';
        this.dockerContextPath = path.join(__dirname, '../../sandbox');
        this.activeMissions = new Map();
    }

    async initBuilder() {
        return new Promise((resolve, reject) => {
            console.log('[Sandbox] Ensuring base Docker image exists...');
            exec(`docker build -t ${this.imageName} "${this.dockerContextPath}"`, (error, stdout, stderr) => {
                if (error) {
                    console.error(`[Sandbox] Docker build error: ${error.message}`);
                    return reject(error);
                }
                console.log('[Sandbox] Base image is ready.');
                resolve();
            });
        });
    }

    /**
     * Prepares the workspace by cloning the repository to the host.
     */
    async prepareWorkspace(repository, branch) {
        const missionId = `mission-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        // Using os.tmpdir() for cross-platform compatibility
        const workspacePath = path.join(os.tmpdir(), 'ghostwriter-missions', missionId);

        // Ensure parent dir exists
        fs.mkdirSync(path.join(os.tmpdir(), 'ghostwriter-missions'), { recursive: true });

        const repoUrl = `https://github.com/${repository}.git`;

        console.log(`[Sandbox] Cloning ${repoUrl}#${branch} to ${workspacePath}...`);
        await execAsync(`git clone -b ${branch} ${repoUrl} "${workspacePath}"`);

        this.activeMissions.set(missionId, { workspacePath });
        return { missionId, workspacePath };
    }

    /**
     * Cleans up the workspace from the host.
     */
    async cleanupWorkspace(missionId) {
        const mission = this.activeMissions.get(missionId);
        if (mission && fs.existsSync(mission.workspacePath)) {
            fs.rmSync(mission.workspacePath, { recursive: true, force: true });
            this.activeMissions.delete(missionId);
            console.log(`[Sandbox] Cleaned up workspace for ${missionId}`);
        }
    }

    /**
     * Runs tests inside the Docker sandbox for a given workspace.
     */
    async runTests(missionId, onLog) {
        return new Promise((resolve, reject) => {
            const mission = this.activeMissions.get(missionId);
            if (!mission) throw new Error("Mission workspace not found");

            const containerName = `ghostwriter-test-${missionId}`;
            let combinedLogs = '';

            const logTracker = (data) => {
                const str = data.toString();
                combinedLogs += str;
                if (onLog) onLog(str);
            };

            if (onLog) onLog(`[Sandbox] Running tests in isolated container...\n`);

            // We mount the workspace path to /usr/src/app inside the container
            const dockerArgs = [
                'run',
                '--rm',
                '--name', containerName,
                '-v', `${mission.workspacePath}:/usr/src/app`, // Volume mount
                '--network', 'host',
                this.imageName,
                'sh', '-c',
                'npm install && npm test'
            ];

            const proc = spawn('docker', dockerArgs);

            proc.stdout.on('data', logTracker);
            proc.stderr.on('data', logTracker);

            proc.on('close', (code) => {
                const success = code === 0;
                if (onLog) onLog(`\n[Sandbox] Test execution finished with code ${code}. Status: ${success ? 'SUCCESS' : 'FAILED'}\n`);
                resolve({
                    success,
                    exitCode: code,
                    logs: combinedLogs
                });
            });

            proc.on('error', (err) => {
                if (onLog) onLog(`[Sandbox] Failed to start Docker process: ${err.message}\n`);
                reject(err);
            });
        });
    }
}

module.exports = new SandboxService();
