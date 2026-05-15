const {
  Client,
  Compression,
  Functions,
  Runtime,
  Storage,
  TablesDB,
  TablesDBIndexType,
} = require('node-appwrite');

const { getAppwriteConfig, isAppwriteConflict, isAppwriteMissing } = require('./appwrite-env.cjs');
const { CACHE_BUCKET_ID, DATABASE_ID, FUNCTION_DEFINITIONS, TABLES } = require('./schema.cjs');

const INDEX_TYPES = {
  key: TablesDBIndexType.Key,
  unique: TablesDBIndexType.Unique,
  fulltext: TablesDBIndexType.Fulltext,
  spatial: TablesDBIndexType.Spatial,
};

function createClient() {
  const { endpoint, projectId, apiKey } = getAppwriteConfig();
  return new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
}

async function ignoreExists(action, label) {
  try {
    return await action();
  } catch (error) {
    if (isAppwriteConflict(error)) {
      console.log(`exists ${label}`);
      return null;
    }

    throw error;
  }
}

function hasColumn(table, key) {
  return table.columns?.some((column) => column.key === key);
}

function hasIndex(table, key) {
  return table.indexes?.some((index) => index.key === key);
}

async function waitForColumns(tables, tableId, keys) {
  const deadline = Date.now() + 120_000;

  while (Date.now() < deadline) {
    const table = await tables.getTable({ databaseId: DATABASE_ID, tableId });
    const pending = keys.filter((key) => {
      const column = table.columns?.find((candidate) => candidate.key === key);
      return !column || (column.status && column.status !== 'available');
    });

    if (pending.length === 0) {
      return table;
    }

    await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  throw new Error(`Timed out waiting for columns on ${tableId}: ${keys.join(', ')}`);
}

async function createColumn(tables, tableId, column) {
  const base = {
    databaseId: DATABASE_ID,
    tableId,
    key: column.key,
    required: Boolean(column.required),
  };

  switch (column.type) {
    case 'string':
      return tables.createStringColumn({
        ...base,
        size: column.size,
        xdefault: column.xdefault,
        array: Boolean(column.array),
        encrypt: Boolean(column.encrypt),
      });
    case 'longtext':
      return tables.createLongtextColumn({
        ...base,
        xdefault: column.xdefault,
        array: Boolean(column.array),
        encrypt: Boolean(column.encrypt),
      });
    case 'integer':
      return tables.createIntegerColumn({
        ...base,
        min: column.min,
        max: column.max,
        xdefault: column.xdefault,
        array: Boolean(column.array),
      });
    case 'float':
      return tables.createFloatColumn({
        ...base,
        min: column.min,
        max: column.max,
        xdefault: column.xdefault,
        array: Boolean(column.array),
      });
    case 'boolean':
      return tables.createBooleanColumn({
        ...base,
        xdefault: column.xdefault,
        array: Boolean(column.array),
      });
    case 'datetime':
      return tables.createDatetimeColumn({
        ...base,
        xdefault: column.xdefault,
        array: Boolean(column.array),
      });
    case 'enum':
      return tables.createEnumColumn({
        ...base,
        elements: column.elements,
        xdefault: column.xdefault,
        array: Boolean(column.array),
      });
    case 'ip':
      return tables.createIpColumn({
        ...base,
        xdefault: column.xdefault,
        array: Boolean(column.array),
      });
    default:
      throw new Error(`Unsupported column type ${column.type} for ${tableId}.${column.key}`);
  }
}

async function ensureDatabase(tables) {
  await ignoreExists(
    () => tables.create({ databaseId: DATABASE_ID, name: 'BruinGains Campus', enabled: true }),
    `database ${DATABASE_ID}`,
  );
}

async function ensureBucket(storage) {
  await ignoreExists(
    () =>
      storage.createBucket({
        bucketId: CACHE_BUCKET_ID,
        name: 'Campus Cache',
        permissions: [],
        fileSecurity: false,
        enabled: true,
        maximumFileSize: 30_000_000,
        allowedFileExtensions: ['json'],
        compression: Compression.Gzip,
        encryption: true,
        antivirus: true,
      }),
    `bucket ${CACHE_BUCKET_ID}`,
  );
}

async function ensureTables(tables) {
  for (const definition of TABLES) {
    await ignoreExists(
      () =>
        tables.createTable({
          databaseId: DATABASE_ID,
          tableId: definition.id,
          name: definition.name,
          permissions: [],
          rowSecurity: false,
          enabled: true,
        }),
      `table ${definition.id}`,
    );
  }
}

async function ensureColumnsAndIndexes(tables) {
  for (const definition of TABLES) {
    let table = await tables.getTable({ databaseId: DATABASE_ID, tableId: definition.id });

    for (const column of definition.columns) {
      if (hasColumn(table, column.key)) {
        continue;
      }

      console.log(`create column ${definition.id}.${column.key}`);
      await ignoreExists(
        () => createColumn(tables, definition.id, column),
        `column ${definition.id}.${column.key}`,
      );
    }

    table = await waitForColumns(
      tables,
      definition.id,
      definition.columns.map((column) => column.key),
    );

    for (const index of definition.indexes) {
      if (hasIndex(table, index.key)) {
        continue;
      }

      console.log(`create index ${definition.id}.${index.key}`);
      await ignoreExists(
        () =>
          tables.createIndex({
            databaseId: DATABASE_ID,
            tableId: definition.id,
            key: index.key,
            type: INDEX_TYPES[index.type],
            columns: index.columns,
            orders: index.orders,
            lengths: index.lengths,
          }),
        `index ${definition.id}.${index.key}`,
      );
    }
  }
}

async function ensureFunctions(functions) {
  for (const definition of FUNCTION_DEFINITIONS) {
    const payload = {
      functionId: definition.id,
      name: definition.name,
      runtime: Runtime.Node22,
      execute: definition.execute,
      events: [],
      schedule: definition.schedule,
      timeout: definition.timeout,
      enabled: true,
      logging: true,
      entrypoint: 'src/main.js',
      commands: 'npm install',
      scopes: definition.scopes,
      deploymentRetention: 7,
    };

    try {
      await functions.create(payload);
    } catch (error) {
      if (!isAppwriteConflict(error)) {
        throw error;
      }

      await functions.update(payload);
      console.log(`updated function ${definition.id}`);
    }
  }
}

async function main() {
  const client = createClient();
  const tables = new TablesDB(client);
  const storage = new Storage(client);
  const functions = new Functions(client);

  await ensureDatabase(tables);
  await ensureBucket(storage);
  await ensureTables(tables);
  await ensureColumnsAndIndexes(tables);
  await ensureFunctions(functions);

  const tableList = await tables.listTables({ databaseId: DATABASE_ID, total: true });
  console.log(`ready ${DATABASE_ID}: ${tableList.total} tables`);
}

main().catch((error) => {
  if (isAppwriteMissing(error)) {
    console.error(error.message);
  } else {
    console.error(error);
  }
  process.exitCode = 1;
});
