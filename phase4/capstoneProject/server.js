const { Client } = require('pg');

const client = new Client({
    user: 'dsaeotks',
    host: 'jelani.db.elephantsql.com',
    database: 'dsaeotks',
    password: '7jCyv7wSMTQOUTHTEsRNsvjOCOLSJ6h1',
    port: 5432,
});

client.connect();
const query = `
CREATE TABLE garBAG(
    name varchar
)
`;

client.query(query, (err, res) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log('Table is successfully created');
    client.end();
});