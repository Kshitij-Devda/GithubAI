// Simple script to test GitHub API
import { Octokit } from 'octokit';

const octokit = new Octokit({
  request: {
    timeout: 30000 // Increase timeout to 30 seconds
  }
});

const githubUrl = 'https://github.com/kshitij-Devda/First_Project';

async function getCommits(githubUrl : string) {
  try {
    // Parse the GitHub URL to get owner and repo
    const [owner, repo] = githubUrl.split('/').slice(-2);
    console.log(`Fetching commits for ${owner}/${repo}...`);
    
    // Call the GitHub API
    const { data } = await octokit.rest.repos.listCommits({
      owner: owner || '',
      repo: repo || ''
    });
    
    console.log(`Found ${data.length} commits`);
    
    // Sort commits by date (newest first)
    const sortedCommits = data.sort(
      (a, b) => new Date(b.commit?.author?.date || '').getTime() - new Date(a.commit?.author?.date || '').getTime()
    );
    
    // Return the formatted commits
    return sortedCommits.slice(0, 15).map(commit => ({
      commitHash: commit.sha,
      commitMessage: commit.commit.message || "",
      commitAuthorName: commit.commit?.author?.name || "",
      commitAuthorAvatar: commit.author?.avatar_url || "",
      commitDate: commit.commit?.author?.date || ""
    }));
  } catch (error) {
    console.error('Error fetching commits:', error);
    return [];
  }
}

// Execute the script
(async () => {
  try {
    console.log("Testing GitHub API...");
    const commits = await getCommits(githubUrl);
    console.log('Commits found:', commits.length);
    if (commits.length > 0) {
      console.log('First commit:', JSON.stringify(commits[0], null, 2));
    }
  } catch (error) {
    console.error('Error:', error);
  }
})(); 