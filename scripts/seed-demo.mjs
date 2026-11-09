import {
  Client,
  Users,
  TablesDB,
  Storage,
  Query,
} from "node-appwrite";

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const project = process.env.NEXT_PUBLIC_APPWRITE_PROJECT;
const key = process.env.NEXT_APPWRITE_KEY;
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const WORKSPACES_ID = process.env.NEXT_PUBLIC_APPWRITE_WORKSPACES_ID;
const MEMBERS_ID = process.env.NEXT_PUBLIC_APPWRITE_MEMBERS_ID;
const PROJECTS_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECTS_ID;
const TASKS_ID = process.env.NEXT_PUBLIC_APPWRITE_TASKS_ID;
const IMAGES_BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_IMAGES_BUCKET_ID;

const required = {
  NEXT_PUBLIC_APPWRITE_ENDPOINT: endpoint,
  NEXT_PUBLIC_APPWRITE_PROJECT: project,
  NEXT_APPWRITE_KEY: key,
  NEXT_PUBLIC_APPWRITE_DATABASE_ID: DATABASE_ID,
  NEXT_PUBLIC_APPWRITE_WORKSPACES_ID: WORKSPACES_ID,
  NEXT_PUBLIC_APPWRITE_MEMBERS_ID: MEMBERS_ID,
  NEXT_PUBLIC_APPWRITE_PROJECTS_ID: PROJECTS_ID,
  NEXT_PUBLIC_APPWRITE_TASKS_ID: TASKS_ID,
  NEXT_PUBLIC_APPWRITE_IMAGES_BUCKET_ID: IMAGES_BUCKET_ID,
};
const missing = Object.entries(required).filter(([, v]) => !v).map(([k]) => k);
if (missing.length > 0) {
  console.error(`Missing environment variables: ${missing.join(", ")}`);
  process.exit(1);
}

const client = new Client().setEndpoint(endpoint).setProject(project).setKey(key);
const users = new Users(client);
const tablesDB = new TablesDB(client);
const storage = new Storage(client);

const PASSWORD = "demo1234";
const INVITE_CODE = "DEMO01";
const PREFIX = "demo-";

const PEOPLE = [
  { id: "demo-user", email: "demo@taskmanager.dev", name: "Demo User", role: "ADMIN" },
  { id: "demo-alex", email: "alex@taskmanager.dev", name: "Alex Rivera", role: "MEMBER" },
  { id: "demo-sam", email: "sam@taskmanager.dev", name: "Sam Chen", role: "MEMBER" },
  { id: "demo-jordan", email: "jordan@taskmanager.dev", name: "Jordan Patel", role: "MEMBER" },
];

const WORKSPACE = { id: "demo-workspace", name: "Acme Product Team", initials: "AP", color: "#4f46e5" };

const PROJECTS = [
  { id: "demo-project-website", name: "Website Redesign", initials: "WR", color: "#0ea5e9" },
  { id: "demo-project-mobile", name: "Mobile App", initials: "MA", color: "#10b981" },
  { id: "demo-project-marketing", name: "Marketing Site", initials: "MS", color: "#f59e0b" },
];

const TASKS = [
  { id: "demo-task-1", name: "Audit the current site and gather requirements", status: "DONE", project: "demo-project-website", assignee: "demo-alex", due: -21, description: "Collect analytics, stakeholder interviews and competitor notes." },
  { id: "demo-task-2", name: "Design the new landing page in Figma", status: "DONE", project: "demo-project-website", assignee: "demo-sam", due: -14, description: "Hero, feature grid and pricing blocks." },
  { id: "demo-task-3", name: "Implement the responsive navigation", status: "IN_PROGRESS", project: "demo-project-website", assignee: "demo-alex", due: 3, description: "Desktop mega menu plus a mobile sheet." },
  { id: "demo-task-4", name: "Build the pricing section", status: "TODO", project: "demo-project-website", assignee: "demo-user", due: 7, description: "Three tiers with a monthly/yearly toggle." },
  { id: "demo-task-5", name: "Add the contact form with validation", status: "BACKLOG", project: "demo-project-website", assignee: "demo-sam", due: 14, description: "Server side validation and spam protection." },
  { id: "demo-task-6", name: "Bootstrap the React Native project", status: "DONE", project: "demo-project-mobile", assignee: "demo-jordan", due: -30, description: "Expo, TypeScript, linting and CI." },
  { id: "demo-task-7", name: "Implement the authentication flow", status: "IN_REVIEW", project: "demo-project-mobile", assignee: "demo-alex", due: 2, description: "Email sign in plus social providers." },
  { id: "demo-task-8", name: "Wire up push notifications", status: "IN_PROGRESS", project: "demo-project-mobile", assignee: "demo-sam", due: 5, description: "FCM and APNs tokens per device." },
  { id: "demo-task-9", name: "Offline data sync", status: "TODO", project: "demo-project-mobile", assignee: "demo-jordan", due: 10, description: "Queue mutations and reconcile on reconnect." },
  { id: "demo-task-10", name: "Prepare app store screenshots", status: "BACKLOG", project: "demo-project-mobile", assignee: "demo-alex", due: 21 },
  { id: "demo-task-11", name: "Content inventory and migration plan", status: "IN_PROGRESS", project: "demo-project-marketing", assignee: "demo-user", due: 4, description: "Map every existing URL to its new home." },
  { id: "demo-task-12", name: "SEO metadata for all pages", status: "TODO", project: "demo-project-marketing", assignee: "demo-jordan", due: 9 },
  { id: "demo-task-13", name: "Launch the blog section", status: "BACKLOG", project: "demo-project-marketing", assignee: "demo-sam", due: 18, description: "MDX authoring plus an RSS feed." },
  { id: "demo-task-14", name: "Fix flaky end-to-end tests", status: "TODO", project: "demo-project-website", assignee: "demo-user", due: -2, description: "Intermittent failures in the checkout spec." },
];

const memberId = (userId) => `${userId}-member`;
const iconId = (id) => `${id}-icon`;

const svgIcon = (initials, color) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">` +
  `<rect width="128" height="128" rx="28" fill="${color}"/>` +
  `<text x="50%" y="50%" dy="0.35em" text-anchor="middle" font-family="system-ui, sans-serif" ` +
  `font-size="52" font-weight="600" fill="#ffffff">${initials}</text></svg>`;

const dueDate = (inDays) => {
  const date = new Date(Date.now() + inDays * 86_400_000);
  date.setUTCHours(12, 0, 0, 0);
  return date.toISOString();
};

const isConflict = (err) => err?.code === 409;

async function ensureUser(person) {
  try {
    await users.create(person.id, person.email, null, PASSWORD, person.name);
    console.log(`  + user     ${person.email}`);
    return;
  } catch (err) {
    if (!isConflict(err)) throw err;
  }
  await users.updatePassword(person.id, PASSWORD);
  console.log(`  = user     ${person.email}`);
}

async function ensureIcon(id, initials, color) {
  try {
    const file = new File([svgIcon(initials, color)], `${id}.svg`, { type: "image/svg+xml" });
    await storage.createFile(IMAGES_BUCKET_ID, id, file);
    console.log(`  + icon     ${id}`);
  } catch (err) {
    if (!isConflict(err)) throw err;
    console.log(`  = icon     ${id}`);
  }
}

async function ensureRow(tableId, rowId, data) {
  try {
    await tablesDB.createRow(DATABASE_ID, tableId, rowId, data);
    console.log(`  + ${tableId.padEnd(10)} ${rowId}`);
  } catch (err) {
    if (!isConflict(err)) throw err;
    console.log(`  = ${tableId.padEnd(10)} ${rowId}`);
  }
}

async function reset() {
  console.log("Removing previously seeded demo data...\n");

  for (const tableId of [TASKS_ID, PROJECTS_ID, MEMBERS_ID, WORKSPACES_ID]) {
    const { rows } = await tablesDB.listRows(DATABASE_ID, tableId, [Query.limit(500)]);
    for (const row of rows) {
      if (row.$id.startsWith(PREFIX)) {
        await tablesDB.deleteRow(DATABASE_ID, tableId, row.$id);
        console.log(`  - ${tableId.padEnd(10)} ${row.$id}`);
      }
    }
  }

  const { files } = await storage.listFiles(IMAGES_BUCKET_ID, [Query.limit(500)]);
  for (const file of files) {
    if (file.$id.startsWith(PREFIX)) {
      await storage.deleteFile(IMAGES_BUCKET_ID, file.$id);
      console.log(`  - file       ${file.$id}`);
    }
  }

  const { users: accounts } = await users.list([Query.limit(500)]);
  for (const account of accounts) {
    if (account.$id.startsWith(PREFIX)) {
      await users.delete(account.$id);
      console.log(`  - user       ${account.email}`);
    }
  }

  console.log("");
}

if (process.argv.includes("--reset")) {
  await reset();
}

console.log(`Seeding demo data into project ${project}\n`);

await ensureUser(PEOPLE[0]);
console.log("");
for (const person of PEOPLE.slice(1)) {
  await ensureUser(person);
}

console.log("");
await ensureIcon(WORKSPACE.id, WORKSPACE.initials, WORKSPACE.color);
for (const proj of PROJECTS) {
  await ensureIcon(iconId(proj.id), proj.initials, proj.color);
}

console.log("");
await ensureRow(WORKSPACES_ID, WORKSPACE.id, {
  name: WORKSPACE.name,
  userId: PEOPLE[0].id,
  imageUrl: WORKSPACE.id,
  inviteCode: INVITE_CODE,
});

console.log("");
for (const person of PEOPLE) {
  await ensureRow(MEMBERS_ID, memberId(person.id), {
    userId: person.id,
    workspaceId: WORKSPACE.id,
    role: person.role,
  });
}

console.log("");
for (const proj of PROJECTS) {
  await ensureRow(PROJECTS_ID, proj.id, {
    name: proj.name,
    imageUrl: iconId(proj.id),
    workspaceId: WORKSPACE.id,
  });
}

console.log("");
const positions = {};
for (const task of TASKS) {
  positions[task.status] = (positions[task.status] ?? 0) + 1;
  await ensureRow(TASKS_ID, task.id, {
    name: task.name,
    status: task.status,
    workspaceId: WORKSPACE.id,
    projectId: task.project,
    assigneeId: memberId(task.assignee),
    position: positions[task.status] * 1000,
    dueDate: dueDate(task.due),
    description: task.description,
  });
}

console.log(`
Done. Seeded:
  workspace  ${WORKSPACE.name}
  projects   ${PROJECTS.length}
  members    ${PEOPLE.length}
  tasks      ${TASKS.length}
  invite     ${INVITE_CODE}

Demo accounts (password: ${PASSWORD}):
${PEOPLE.map((p) => `  ${p.email.padEnd(26)} ${p.role}`).join("\n")}
`);
