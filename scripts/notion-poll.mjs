// scripts/notion-poll.mjs
//
// Polls a Notion database for cards whose Status is "Ready for Dev" and
// which have not yet been synced to GitHub (tracked via a "GitHub Issue"
// URL property on the card). For each new card it:
//   1. Creates a GitHub issue labeled "agent-ready" + "from-notion"
//   2. Writes the issue URL back onto the Notion card
//   3. Moves the card's Status to "In Progress"
//
// Expected Notion database schema (rename in the CONFIG block if yours differs):
//   - Name           (title)       — becomes the issue title
//   - Description    (rich_text)   — becomes the issue body
//   - Status         (select)      — must have "Ready for Dev" and "In Progress" options
//   - GitHub Issue   (url)         — written by this script, used as the "already synced" marker
//
// Required env vars: NOTION_API_KEY, NOTION_DATABASE_ID, GITHUB_TOKEN, GITHUB_REPOSITORY

import { Client } from "@notionhq/client";
import { Octokit } from "@octokit/rest";

// Written to the GitHub Issue property to claim a card before its issue
// exists. Any non-empty value excludes the card from the query filter.
const CLAIM_MARKER = "https://github.com/pending";

const CONFIG = {
  statusProperty: "Status",
  readyStatusValue: "Ready for Dev",
  inProgressStatusValue: "In Progress",
  titleProperty: "Name",
  descriptionProperty: "Description",
  githubIssueProperty: "GitHub Issue",
};

const missing = [
  "NOTION_API_KEY",
  "NOTION_DATABASE_ID",
  "GITHUB_TOKEN",
  "GITHUB_REPOSITORY",
].filter((name) => !process.env[name]);

if (missing.length > 0) {
  console.error(`Missing required env vars: ${missing.join(", ")}`);
  process.exit(1);
}

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

function plainTextFromRichText(richText = []) {
  return richText.map((t) => t.plain_text).join("");
}

async function findUnsyncedReadyCards() {
  const response = await notion.databases.query({
    database_id: process.env.NOTION_DATABASE_ID,
    filter: {
      and: [
        {
          property: CONFIG.statusProperty,
          select: { equals: CONFIG.readyStatusValue },
        },
        {
          property: CONFIG.githubIssueProperty,
          url: { is_empty: true },
        },
      ],
    },
  });
  return response.results;
}

async function createIssueForCard(card) {
  const title = plainTextFromRichText(
    card.properties[CONFIG.titleProperty]?.title ?? []
  ) || "Untitled roadmap card";

  const description = plainTextFromRichText(
    card.properties[CONFIG.descriptionProperty]?.rich_text ?? []
  );

  const body = [
    description || "_No description provided on the Notion card._",
    "",
    "---",
    `Synced automatically from Notion. Source card: ${card.url}`,
  ].join("\n");

  const issue = await octokit.issues.create({
    owner,
    repo,
    title,
    body,
    labels: ["agent-ready", "from-notion"],
  });

  return issue.data;
}

// Claimed BEFORE the issue is created, so a crash between the two steps
// leaves a card that this script skips rather than one it files again on
// every subsequent poll. A claimed card with no issue link is visible in
// Notion and recoverable by hand; a duplicate issue is a duplicate cloud
// session against the daily routine cap, every 15 minutes, forever.
async function claimCard(card) {
  await notion.pages.update({
    page_id: card.id,
    properties: {
      [CONFIG.githubIssueProperty]: { url: CLAIM_MARKER },
      [CONFIG.statusProperty]: {
        select: { name: CONFIG.inProgressStatusValue },
      },
    },
  });
}

async function recordIssueUrl(card, issueUrl) {
  await notion.pages.update({
    page_id: card.id,
    properties: {
      [CONFIG.githubIssueProperty]: { url: issueUrl },
    },
  });
}

async function main() {
  const cards = await findUnsyncedReadyCards();

  if (cards.length === 0) {
    console.log("No new roadmap cards ready for dev.");
    return;
  }

  console.log(`Found ${cards.length} card(s) to sync.`);

  let failed = 0;

  for (const card of cards) {
    try {
      await claimCard(card);
      const issue = await createIssueForCard(card);
      await recordIssueUrl(card, issue.html_url);
      console.log(`Synced card ${card.id} -> ${issue.html_url}`);
    } catch (err) {
      // Don't let one bad card fail the whole run, but don't let the run
      // report success either — a green cron job that synced nothing is
      // how this entry point dies quietly.
      failed += 1;
      console.error(`Failed to sync card ${card.id}:`, err.message);
    }
  }

  if (failed > 0) {
    throw new Error(`${failed} of ${cards.length} card(s) failed to sync.`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
