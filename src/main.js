const { invoke } = window.__TAURI__.core;
import { appDir, join } from '@tauri-apps/api/path';

// List of pull request IDs you want to merge
const pullRequestIds = [1234, 5678, 9012];

// URL of the Blender repository
const repoUrl = "https://projects.blender.org/blender/blender.git";

// Directory to clone the repo into
const cloneDir = await join(await appDir(), 'makemeablender', 'blender');

async function runGitCommand(command) {
  try {
    const result = await invoke('run_git_command', { command });
    console.log(result);
    return result;
  } catch (error) {
    console.error('Error running command:', error);
  }
}

async function cloneAndMergePRs() {
  console.log("Cloning the Blender repository...");
  await runGitCommand(`git clone ${repoUrl} ${cloneDir}`);

  // Change directory to the cloned repository (handled by invoking commands with specific cwd)
  console.log("Changing directory to the cloned repository...");
  await runGitCommand(`cd ${cloneDir} && git pull`);

  for (const prId of pullRequestIds) {
    console.log(`Fetching and merging pull request #${prId}...`);
    await runGitCommand(`cd ${cloneDir} && git fetch origin pull/${prId}/head:pr-${prId}`);
    await runGitCommand(`cd ${cloneDir} && git merge --no-ff pr-${prId}`);
  }

  console.log("All pull requests have been merged.");
}

// Call the function to clone and merge PRs
cloneAndMergePRs();
