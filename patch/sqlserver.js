//import {Connection} from 'mssql';
const sql = require('mssql');

const debug = require('../../debug')('db:clients:sqlserver');
const REGEX_BEGIN_QUERY = /^(\n|\s)*/g;
const REGEX_BETWEEN_QUERIES = /;(\n|\s)*/g;
const REGEX_END_QUERY = /;/g;


const _configDatabase = (serverInfo, databaseName) => {
  const {host, port, user, password} = serverInfo;
  const config = {
    user,
    password,
    server: host,
    database: databaseName,
    port,
    options: {
      encrypt: true,
    },
  };
  return config;
};


exports['default'] = function(serverInfo, databaseName) {
  return new Promise(async (resolve) => {
    debug('creating database connection');
    const connection = new sql.Connection(_configDatabase(serverInfo, databaseName));
    connection.on('error', (err) => {
      debug('CONNECTION ERROR!', err);
      connection.close();
    });
    await connection.connect();
    debug('connected');

    resolve({
      disconnect: () => disconnect(connection),
      listTables: () => listTables(connection),
      executeQuery: (query) => executeQuery(connection, query),
      listDatabases: () => listDatabases(connection),
      getQuerySelectTop: (table, limit) => getQuerySelectTop(connection, table, limit),
      truncateAllTables: () => truncateAllTables(connection),
    });
  });
};

exports.disconnect = (connection) => connection.close();
exports.wrapQuery = (item) => `[${item}]`;
exports.getQuerySelectTop = (client, table, limit) => `select top ${limit} * from ${wrapQuery(table)}`;


const executePromiseQuery = (connection, query) => new Promise(async (resolve, reject) => {
  try {
    const realQuery = `${query}; select @@ROWCOUNT as 'rowCount';`;
    const request = connection.request();
    const recordSet = await request.query(realQuery);
    const isSelect = !recordSet.length || (recordSet[0] && recordSet[0].rowCount === undefined);

    if (isSelect) {
      resolve({
        rows: recordSet,
        fields: Object.keys(recordSet[0] || {}).map(name => ({ name })),
        rowCount: recordSet.length,
        affectedRows: undefined,
      });
    } else {
      const rowCount = recordSet[0].rowCount;
      resolve({
        rows: [],
        fields: [],
        rowCount: undefined,
        affectedRows: rowCount,
      });
    }
  } catch (e) {
    reject(e);
  }
});


//exports.executeQuery = async (connection, query) => {
async function executeQuery(connection, query){
  const statements = query
    .replace(REGEX_BEGIN_QUERY, '')
    .replace(REGEX_BETWEEN_QUERIES, ';')
    .split(REGEX_END_QUERY)
    .filter(text => text.length);

  const queries = statements.map(statement => executePromiseQuery(connection, statement));

  const results = await Promise.all(queries);
  if (statements.length === 1) {
    return results[0];
  }

  return results.reduce((allResults, result) => {
    allResults.rows.push(result.rows);
    allResults.fields.push(result.fields);
    allResults.rowCount.push(result.rowCount);
    allResults.affectedRows.push(result.affectedRows);
    return allResults;
  }, { rows: [], fields: [], rowCount: [], affectedRows: [] });
};


const getSchema = async (connection) => {
  const result = await executeQuery(connection, `select schema_name() as 'schema'`);
  return result.rows[0].schema;
};


async function listTables(connection) {
  const result = await executeQuery(connection, 'select table_name from information_schema.tables order by table_name');
  return result.rows.map(row => row.table_name);
};


async function listDatabases(connection){
  const result = await executeQuery(connection, 'select name from sys.databases');
  return result.rows.map(row => row.name);
};


exports.truncateAllTables = async (connection) => {
  const schema = await getSchema(connection);
  const result = await executeQuery(connection, `select table_name from information_schema.tables where table_schema = '${schema}'`);
  const tables = result.rows.map(row => row.table_name);
  const promises = tables.map(t => executeQuery(connection, `truncate table ${wrapQuery(schema)}.${wrapQuery(t)}`));
  await Promise.all(promises);
};
