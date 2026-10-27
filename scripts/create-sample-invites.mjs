// Run once locally. Never copy .sample-private into the public build or Git.
import { randomBytes, createHash } from 'node:crypto';
import { mkdir, writeFile, access } from 'node:fs/promises';
const output = '.sample-private/access.json';
try { await access(output); throw new Error('Invitations already exist; refusing to replace them.'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const token = () => randomBytes(32).toString('base64url');
const credentials = { admin: token(), friends: Array.from({ length: 11 }, token), tests: Array.from({ length: 3 }, token) };
const hash = value => createHash('sha256').update(value).digest('hex');
await mkdir('.sample-private', { recursive: true });
await writeFile(output, JSON.stringify(credentials, null, 2));
await writeFile('netlify/lib/sample-access.mjs', `// Only SHA-256 digests belong in Git. The original links stay with Sam.\nexport const adminHash = ${JSON.stringify(hash(credentials.admin))};\nexport const inviteHashes = ${JSON.stringify(credentials.friends.map(hash))};\nexport const testInviteHashes = ${JSON.stringify(credentials.tests.map(hash))};\n`);
const base = 'https://deploy-preview-3--celadon-melomakarona-a77f9d.netlify.app/studio/samples/';
const rows = credentials.friends.map((code, i) => `<tr><td>Friend ${i + 1}</td><td><a href="${base}#invite=${code}">Open invitation ${i + 1}</a><br><input aria-label="Invitation ${i + 1} URL" readonly value="${base}#invite=${code}" onclick="this.select()"></td><td><input aria-label="Your note for friend ${i + 1}" placeholder="Note who you sent this to"></td></tr>`).join('');
await writeFile('.sample-private/SABI-sample-invitations.html', `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Your SABI sample invitations</title><style>body{background:#f4eedf;color:#293c36;font:17px/1.6 Arial;max-width:950px;margin:40px auto;padding:20px}h1{font:48px Georgia}td{padding:15px;border-bottom:1px solid #b5b6a5}input{width:100%;padding:10px;box-sizing:border-box}a{color:#293c36}table{width:100%}</style><h1>Your little sample circle</h1><p><strong>Keep this file for yourself.</strong> Send a different invitation link to each friend. Each invitation can claim one item; each product has one sample across all sizes. Do not send this whole file or the organiser link.</p><p><a href="${base}admin.html#admin=${credentials.admin}">Open your private sample organiser →</a></p><p>The organiser shows requests and delivery addresses. You place and pay for supplier orders yourself, then update the status. Cancelling releases the product, but the invitation stays used. The notes below are just a scratchpad and do not save when you close this file.</p><table><thead><tr><th>Invitation</th><th>Link to send</th><th>Who it is for</th></tr></thead><tbody>${rows}</tbody></table>`);
console.log('Created 11 single-use invitations and a private organiser link. Secrets were saved locally, not printed.');
