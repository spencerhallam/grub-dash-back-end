const path = require("path");
const orders = require(path.resolve("src/data/orders-data"));
const nextId = require("../utils/nextId");

function orderExists(req, res, next) {
    const orderId = req.params.orderId;
    const foundOrder = orders.find(order => order.id === orderId);
    if(foundOrder) {
        res.locals.order = foundOrder;
        return next();
    }
    return next({
        status: 404,
        message: `Could not find order ID: ${orderId}`
    });
}

function deliverToValidation(req, res, next) {
    const {data: {deliverTo} = {}} = req.body;
    if(deliverTo && deliverTo.length > 0) {
        return next();
    }
    return next({
        status: 400,
        message: "Order must include a deliverTo"
    });
}

function mobileNumberValidation(req, res, next) {
    const {data: {mobileNumber} = {}} = req.body;
    if(mobileNumber && mobileNumber.length > 0) {
        return next();
    }
    return next({
        status: 400,
        message: "Order must include a mobileNumber"
    });
}

function statusValidation(req, res, next) {
    const {data: {status} = {}} = req.body;
    if(status && status.length > 0 && status !== "invalid") {
        return next();
    }
    if(!status || !status.length) {
        return next({
            status: 400,
            message: "Order must have a status of pending, preparing, out-for-delivery, delivered"
        });
    }
    if(status === "delivered") {
        return next({
            status: 400,
            message: "A delivered order cannot be changed"
        });
    }
    return next({
        status: 400,
        message: "Order must include a status"
    });
}
function pendingStatusValidation(req, res, next) {
    const status = res.locals.order.status;
    if(status === "pending") {
        console.log("next");
        return next();
    }
    return next({
        status: 400,
        message: "An order cannot be deleted unless it is pending."
    });
}

function dishesValidation(req, res, next) {
    const {data: {dishes} = {}} = req.body;
    if(dishes && Array.isArray(dishes) && dishes.length > 0) {
        return next();
    }
    if(!Array.isArray(dishes) || dishes.length === 0) {
        return next({
            status: 400,
            message: "Order must include at least one dish"
        });
    }
    return next({
        status: 400,
        message: "Order must include a dish"
    });
}
function dishQuantityValidation(req, res, next) {
    const {data: {dishes} = {}} = req.body;
    const invalidDishIndex = dishes.findIndex(dish => {
        const isValid = Boolean(dish.quantity) && Number.isInteger(dish.quantity) && dish.quantity > 0;
        return !isValid;
    });
    if(invalidDishIndex === -1) {
        return next();
    }
    return next({
        status: 400,
        message: `dish ${invalidDishIndex} must have a quantity that is an integer greater than 0`
    });
}

function matchesRouteId(req, res, next) {
    const orderId = req.params.orderId;
    const hasMatchingIds = req.body.data.id === orderId;
    if(!req.body.data.id) {
        return next();
    }
    if(req.body.data.id && hasMatchingIds) {
        return next();
    }
    return next({
        status: 400,
        message: `Order id does not match route id. Order: ${req.body.data.id}, Route: ${orderId}`
    });
}

function read(req, res, next) {
    res.status(200).json({data: res.locals.order});
}

function list(req, res, next) {
    res.status(200).json({data: orders});
}

function update(req, res, next) {
    const {data: {id, deliverTo, mobileNumber, status, dishes} = {}} = req.body;
    const orderIndex = orders.findIndex(order => order.id === id);
    const orderId = id ? id : req.params.orderId;
    const updatedOrder = {
        id: orderId,
        deliverTo,
        mobileNumber,
        status,
        dishes
    };
    orders.splice(orderIndex, 1, updatedOrder);
    res.status(200).json({data: updatedOrder});
}

function create(req, res, next) {
    const {data: {deliverTo, mobileNumber, status, dishes} = {}} = req.body;
    const newOrderId = nextId();
    const newOrder = {
        id: newOrderId,
        deliverTo,
        mobileNumber,
        status,
        dishes
    };
    orders.push(newOrder);
    res.status(201).json({data: newOrder});
}

function destroy(req, res, next) {
    const {orderId} = req.params;
    const index = orders.findIndex(order => order.id === orderId);
    if(index > -1) {
        orders.splice(index, 1);
    }
    res.sendStatus(204);
}

module.exports = {
    list,
    read: [orderExists, read],
    update: [orderExists, matchesRouteId, statusValidation, deliverToValidation, dishesValidation, mobileNumberValidation, dishQuantityValidation, update],
    create: [dishesValidation, deliverToValidation, mobileNumberValidation, dishQuantityValidation, create],
    delete: [orderExists, pendingStatusValidation, destroy],
    orderExists
};
