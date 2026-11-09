const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const project = process.env.NEXT_PUBLIC_APPWRITE_PROJECT;
const key = process.env.NEXT_APPWRITE_KEY;
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

if (!endpoint || !project || !key || !DATABASE_ID) {
  console.error(
    "Missing env vars. Required: NEXT_PUBLIC_APPWRITE_ENDPOINT, NEXT_PUBLIC_APPWRITE_PROJECT, NEXT_APPWRITE_KEY, NEXT_PUBLIC_APPWRITE_DATABASE_ID"
  );
  process.exit(1);
}

const WORKSPACES_ID = process.env.NEXT_PUBLIC_APPWRITE_WORKSPACES_ID ?? "workspaces";
const MEMBERS_ID = process.env.NEXT_PUBLIC_APPWRITE_MEMBERS_ID ?? "members";
const PROJECTS_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECTS_ID ?? "projects";
const TASKS_ID = process.env.NEXT_PUBLIC_APPWRITE_TASKS_ID ?? "tasks";
const IMAGES_BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_IMAGES_BUCKET_ID ?? "images";

const headers = {
  "X-Appwrite-Project": project,
  "X-Appwrite-Key": key,
  "Content-Type": "application/json",
};

const tablesBase = `${endpoint}/tablesdb/${DATABASE_ID}/tables`;
const bucketsUrl = `${endpoint}/storage/buckets`;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function request(method, url, body) {
  const res = await fetch(url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : undefined;
  } catch {
    data = text;
  }
  return { status: res.status, data };
}

async function ensure(label, method, url, body) {
  const { status, data } = await request(method, url, body);
  if (status === 409) {
    console.log(`  = exists  ${label}`);
    return data;
  }
  if (status >= 400) {
    throw new Error(`${label} failed: ${status} ${JSON.stringify(data)}`);
  }
  console.log(`  + created ${label}`);
  return data;
}

const userPermissions = [
  'read("users")',
  'create("users")',
  'update("users")',
  'delete("users")',
];

const columns = {
  [WORKSPACES_ID]: [
    { kind: "string", key: "name", size: 100, required: true },
    { kind: "string", key: "userId", size: 50, required: true },
    { kind: "string", key: "imageUrl", size: 5_000_000, required: false },
    { kind: "string", key: "inviteCode", size: 50, required: true },
  ],
  [MEMBERS_ID]: [
    { kind: "string", key: "userId", size: 50, required: true },
    { kind: "string", key: "workspaceId", size: 50, required: true },
    { kind: "string", key: "role", size: 20, required: true },
  ],
  [PROJECTS_ID]: [
    { kind: "string", key: "name", size: 100, required: true },
    { kind: "string", key: "imageUrl", size: 5_000_000, required: false },
    { kind: "string", key: "workspaceId", size: 50, required: true },
  ],
  [TASKS_ID]: [
    { kind: "string", key: "name", size: 100, required: true },
    { kind: "string", key: "status", size: 20, required: true },
    { kind: "string", key: "workspaceId", size: 50, required: true },
    { kind: "string", key: "projectId", size: 50, required: true },
    { kind: "string", key: "assigneeId", size: 50, required: true },
    { kind: "integer", key: "position", required: true },
    { kind: "datetime", key: "dueDate", required: true },
    { kind: "string", key: "description", size: 5_000, required: false },
  ],
};

const indexes = {
  [TASKS_ID]: [
    { key: "name_search", type: "fulltext", columns: ["name"] },
    { key: "workspaceId_index", type: "key", columns: ["workspaceId"] },
    { key: "projectId_index", type: "key", columns: ["projectId"] },
    { key: "status_index", type: "key", columns: ["status"] },
    { key: "assigneeId_index", type: "key", columns: ["assigneeId"] },
  ],
  [MEMBERS_ID]: [
    { key: "workspaceId_index", type: "key", columns: ["workspaceId"] },
    { key: "userId_index", type: "key", columns: ["userId"] },
  ],
  [PROJECTS_ID]: [
    { key: "workspaceId_index", type: "key", columns: ["workspaceId"] },
  ],
};

async function waitForColumns(tableId, keys) {
  const deadline = Date.now() + 180_000;
  while (true) {
    const { data } = await request("GET", `${tablesBase}/${tableId}/columns`);
    const list = data?.columns ?? [];
    const pending = [];
    for (const key of keys) {
      const column = list.find((c) => c.key === key);
      if (!column) pending.push(key);
      else if (column.status === "failed") throw new Error(`Column ${tableId}.${key} failed to build`);
      else if (column.status !== "available") pending.push(key);
    }
    if (pending.length === 0) return;
    if (Date.now() > deadline) throw new Error(`Timed out waiting for ${tableId} columns: ${pending.join(", ")}`);
    await sleep(1500);
  }
}

console.log(`Provisioning Appwrite (TablesDB) on project ${project}`);
console.log(`Endpoint: ${endpoint}`);
console.log(`Database: ${DATABASE_ID}\n`);

console.log("Tables (collections):");
for (const [tableId, tableName] of [
  [WORKSPACES_ID, "Workspaces"],
  [MEMBERS_ID, "Members"],
  [PROJECTS_ID, "Projects"],
  [TASKS_ID, "Tasks"],
]) {
  await ensure(`table ${tableId}`, "POST", tablesBase, {
    tableId,
    name: tableName,
    permissions: userPermissions,
  });
}

console.log("\nColumns (attributes):");
for (const [tableId, cols] of Object.entries(columns)) {
  for (const col of cols) {
    const { kind, key: colKey, ...rest } = col;
    await ensure(`${tableId}.${colKey} (${kind})`, "POST", `${tablesBase}/${tableId}/columns/${kind}`, {
      key: colKey,
      ...rest,
    });
  }
}

console.log("\nStorage:");
await ensure(`bucket ${IMAGES_BUCKET_ID}`, "POST", bucketsUrl, {
  bucketId: IMAGES_BUCKET_ID,
  name: "Images",
  permissions: userPermissions,
});

console.log("\nWaiting for columns to build...");
for (const [tableId, cols] of Object.entries(columns)) {
  await waitForColumns(tableId, cols.map((c) => c.key));
}

console.log("\nIndexes:");
for (const [tableId, idxs] of Object.entries(indexes)) {
  for (const idx of idxs) {
    await ensure(`${tableId}.${idx.key} [index]`, "POST", `${tablesBase}/${tableId}/indexes`, idx);
  }
}

console.log("\nDone.");
