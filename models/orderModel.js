const sql = require('mssql');
const { pool } = require('../config/db');
const { encrypt } = require('../utils/encryption');

async function createOrder(userId, trackingId, amount, amountTax, creditCard) {
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();
        let isUnique = false;
        let orderId;
        
        while(!isUnique) {
            orderId = Math.floor(Math.random()*1000000);
            const checkRequest = new sql.Request(transaction);
            const checkResult = await checkRequest
                .input('orderId', sql.Int, orderId)
                .query(`SELECT COUNT(*) as count FROM Orders WHERE order_id = @orderId`);
            if(checkResult.recordset[0].count === 0) {
                isUnique = true;
            }
        }

        // Encrypt credit card before storing
        const encryptedCreditCard = encrypt(creditCard);
            
        const orderRequest = new sql.Request(transaction);
        const orderResult = await orderRequest
            .input('orderId', sql.Int, orderId)
            .input('trackingId', sql.BigInt, trackingId)
            .input('amount', sql.Decimal(20,2), amount)
            .input('amountTax', sql.Decimal(20,2), amountTax)
            .input('creditCard', sql.VarChar(500), encryptedCreditCard)
            .query(`
                INSERT INTO Orders (order_id, tracking_Id, amount, date_placed, amount_tax, credit_card)
                OUTPUT INSERTED.order_id, INSERTED.date_placed
                VALUES (@orderId, @trackingId, @amount, GETDATE(), @amountTax, @creditCard)
            `);

        const datePlaced = orderResult.recordset[0].date_placed;
        console.log(`Order created: ${orderId}, Date: ${datePlaced}`);
        await transaction.commit();
        return { success: true, orderId, datePlaced };
    } catch (error) {
        await transaction.rollback();
        console.error('Order creation error:', error);
        throw new Error('Transaction failed');
    }
}

module.exports = { createOrder };
