
const express = require('express');
const router = express.Router();
const orderModel = require('../models/orderModel');

async function createOrder(req, res) {
    const { userId, trackingId, amount, amountTax } = req.body;

    if (!userId || !trackingId || !amount || !amountTax) {
        return res.status(400).json({ success: false, message: 'Invalid order data' });
    }

    try {
        const result = await orderModel.createOrder(userId, trackingId, amount, amountTax);

        if (result.success) {
            res.status(201).json({
                success: true,
                message: 'Order created successfully',
                orderId: result.orderId,
                orderDetails: {
                    userId,
                    trackingId,
                    amount,
                    amountTax,
                    datePlaced: result.datePlaced
                }
            });
        } else {
            res.status(500).json({ success: false, message: 'Order creation failed', error: result.error });
        }
    } catch (error) {
        console.error('Order creation error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

router.post('/create-order', createOrder);

module.exports = {createOrder};
