// Usage: GITHUB_TOKEN=... node scripts/unanswered.mjs "repo:vercel/next.js" [limit]
// Lists unanswered Q&A discussions, newest first. Discovery only; write answers yourself.
const filter = process.argv[2] ?? '';
const limit = Number(process.argv[3] ?? 20);
const token = process.env.GITHUB_TOKEN;
if (!token) throw new Error('Set GITHUB_TOKEN');

const query = `query($q:String!,$n:Int!){
  search(query:$q,type:DISCUSSION,first:$n){
    nodes{ ... on Discussion{ title url createdAt comments{totalCount} repository{nameWithOwner stargazerCount} } }
  }
}`;
const since = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);
const q = `is:unanswered created:>=${since} sort:created-desc ${filter}`.trim();

const res = await fetch('https://api.github.com/graphql', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ query, variables: { q, n: limit } }),
});
const json = await res.json();
if (json.errors) throw new Error(JSON.stringify(json.errors));

for (const d of json.data.search.nodes) {
  console.log(
    `${d.createdAt.slice(0, 10)}  ${d.comments.totalCount} komentar  ★${d.repository.stargazerCount}  ${d.repository.nameWithOwner}\n  ${d.title}\n  ${d.url}\n`,
  );
}
