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

const CONFIG = {
  statusProperty: "Status",
  readyStatusValue: "Ready for Dev",
  inProgressStatusValue: "In Progress",
  titleProperty: "Name",
  descriptionProperty: "Description",
  githubIssueProperty: "GitHub Issue",
};

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

async function markCardSynced(card, issueUrl) {
  await notion.pages.update({
    page_id: card.id,
    properties: {
      [CONFIG.githubIssueProperty]: { url: issueUrl },
      [CONFIG.statusProperty]: {
        select: { name: CONFIG.inProgressStatusValue },
      },
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

  for (const card of cards) {
    try {
      const issue = await createIssueForCard(card);
      await markCardSynced(card, issue.html_url);
      console.log(`Synced card ${card.id} -> ${issue.html_url}`);
    } catch (err) {
      // Don't let one bad card fail the whole run.
      console.error(`Failed to sync card ${card.id}:`, err.message);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
