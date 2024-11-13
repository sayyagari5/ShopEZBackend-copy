const sql = require('mssql');
const { pool } = require('../config/db');

function generateOrderId() {
  return Math.floor(Math.random()*1000000);
}

async function createOrder(userId, trackingId, amount, amountTax, creditCard) {
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();
        let isUnique = false;
        while(!isUnique){
            orderId=generateOrderId();
            const checkRequest = new sql.Request(transaction);
            const checkResult= await checkRequest
                .input('orderId', sql.Int, orderId)
                .query(`SELECT COUNT(*) as count FROM Orders WHERE order_id = @orderId`)
            if(checkResult.recordset[0].count ===0){
                isUnique=true;
            }
        }
            
        const orderRequest = new sql.Request(transaction);
        const orderResult = await orderRequest
            .input('orderId',sql.Int, orderId)
            .input('trackingId', sql.BigInt, trackingId)
            .input('amount', sql.Decimal(20,2), amount)
            .input('amountTax', sql.Decimal(20,2), amountTax)
            .input('creditCard', sql.VarChar(255), creditCard)
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
