// const { pool } = require('../config/db');
// const sql = require('mssql');

// async function createOrder(req,res){
//     const{ userId, items} = req.body;
//     const transaction= new sql.Transaction(pool);
//     try{
//         await transaction.begin();
//         const orderRequest= new sql.Request(transaction);
//         const orderResult= await orderRequest
//             .input('userId', sql.Int, userId)
//             .query(`
//                 INSERT INTO Orders(userId)
//                 OUTPUT INSERTED.orderId
//                 VALUES (@userId)
//             `);
//         const orderId = orderResult.recordset[0].orderId;
//         for(const item of items){
//             const itemRequest = new sql.Request(transaction);
//             await itemRequest 
//                 .input('orderId', sql.Int,orderId)
//                 .input('productId', sql.Int,item.productId)
//                 .input('quantity', sql.Int, item.quantity)
//                 .query(`
//                     INSERT INTO OrderItems (orderId, productId, quantity) 
//                     VALUES (@orderId, @productId, @quantity)
//                 `);
//         }
//         await transaction.commit();
//         return {success: true, orderId};
    
//     } catch(error){
//         await transaction.rollback();
//         console.error('Order creation error:',error);
//         throw new Error('Transaction failed');
        
//     }
// }
// module.exports = {createOrder};
const sql = require('mssql');
const { pool } = require('../config/db');

//let orderIDCounter =1;
function generateOrderId() {
  return Math.floor(Math.random()*1000000); // Combine them to create a unique ID
}

async function createOrder(userId, trackingId, amount, amountTax) {
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();
        //const orderId =  generateOrderId(); // Generate a unique order_id
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
            .query(`
                INSERT INTO Orders (order_id,tracking_Id, amount,date_placed, amount_tax)
                OUTPUT INSERTED.order_id, INSERTED.date_placed
                VALUES (@orderId,@trackingId, @amount, GETDATE(),@amountTax)
            `);

        //const orderId = orderResult.recordset[0].orderId;
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
