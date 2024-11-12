const { pool } = require('../config/db');
const sql = require('mssql');

async function createUser(email, password, customerData) {
  let transaction;
  
  try {
    // Ensure we have a connection
    await pool.connect();
    
    transaction = new sql.Transaction(pool);
    await transaction.begin();
    
    // Insert into CUSTOMER table first
    const customerRequest = new sql.Request(transaction);
    await customerRequest
      .input('customer_name', customerData.customerName)
      .input('customer_id', customerData.customerId)
      .input('phone_no', customerData.phoneNo)
      .input('street', customerData.street)
      .input('city', customerData.city)
      .input('state', customerData.state)
      .input('zipcode', customerData.zipcode)
      .input('country', customerData.country)
      .query(`
        INSERT INTO CUSTOMER 
        (customer_name, customer_id, phone_no, street, city, state, zipcode, country) 
        VALUES 
        (@customer_name, @customer_id, @phone_no, @street, @city, @state, @zipcode, @country)
      `);

    // Insert into CUSTOMER_ACCOUNT table
    const accountRequest = new sql.Request(transaction);
    await accountRequest
      .input('email', email)
      .input('customer_id', customerData.customerId)
      .input('account_password', password)
      .query(`
        INSERT INTO CUSTOMER_ACCOUNT 
        (email, customer_id, account_password) 
        VALUES 
        (@email, @customer_id, @account_password)
      `);

    await transaction.commit();
    return true;
  } catch (error) {
    if (transaction) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error('Error rolling back transaction:', rollbackError);
      }
    }
    throw error;
  }
}

async function getUserByEmail(email) {
  try {
    await pool.connect();
    const result = await pool.request()
      .input('email', email)
      .query(`
        SELECT c.*, ca.email, ca.account_password
        FROM CUSTOMER c
        JOIN CUSTOMER_ACCOUNT ca ON c.customer_id = ca.customer_id
        WHERE ca.email = @email
      `);
    return result.recordset[0];
  } catch (error) {
    throw error;
  }
}

module.exports = {
  createUser,
  getUserByEmail
}; 