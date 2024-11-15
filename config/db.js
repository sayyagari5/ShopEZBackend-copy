const sql = require('mssql');
require('dotenv').config();

const config = {
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    options: {
        encrypt: true,
        trustServerCertificate: false
    }
};

const pool = new sql.ConnectionPool(config);
const poolConnect = pool.connect();

poolConnect.then(() => {
    console.log('Connected to SQL Server successfully');
}).catch((err) => {
    console.error('Database connection failed:', err);
    process.exit(1);
});

async function addCreditCardColumn() {
    try {
        await sql.connect(config);
        //await sql.query`ALTER TABLE Orders ADD credit_card VARCHAR(255)`;
        console.log('Credit card column added successfully');
    } catch (err) {
        console.error('Error adding credit card column:', err);
    } finally {
        sql.close();
    }
}

module.exports = { pool, poolConnect }; 