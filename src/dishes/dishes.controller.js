const path = require("path");
const dishes = require(path.resolve("src/data/dishes-data"));
const nextId = require("../utils/nextId");

function dishExists(req, res, next) {
    const dishId = req.params.dishId;
    const foundDish = dishes.find(dish => dish.id === dishId);
    if(foundDish) {
        res.locals.dish = foundDish;
        next();
    }
    next({
        status: 404,
        message: `Could not find dish ID: ${dishId}`
    });
}

function nameValidation(req, res, next) {
    const {data: {name} = {}} = req.body;
    if(name && name.length > 0) {
        return next();
    }
    return next({
        status: 400,
        message: "Dish must include a name"
    });
}

function descriptionValidation(req, res, next) {
    const {data: {description} = {}} = req.body;
    if(description && description.length > 0) {
        return next();
    }
    return next({
        status: 400,
        message: "Dish must include a description"
    });
}
function priceValidation(req, res, next) {
    const {data: {price} = {}} = req.body;
    if(price && price > 0 && Number.isInteger(price)) {
        return next();
    }
    if(!price) {
        return next({
            status: 400,
            message: "Dish must include a price"
        });
    }
    return next({
        status: 400,
        message: "Dish must have a price that is an integer greater than 0"
    });
}
function imageValidation(req, res, next) {
    const {data: {image_url} = {}} = req.body;
    if(image_url && image_url.length > 0) {
        return next();
    }
    return next({
        status: 400,
        message: "Dish must include an image_url"
    });
}

function matchesRouteId(req, res, next) {
    const hasMatchingIds = req.body.data.id === req.params.dishId;
    if(!req.body.data.id) {
        return next();
    }
    if(req.body.data.id && hasMatchingIds) {
        return next();
    }
    return next({
        status: 400,
        message: `Dish id does not match route id. Dish: ${req.body.data.id}, Route: ${req.params.dishId}`
    });
}

function read(req, res, next) {
    res.status(200).json({data: res.locals.dish});
}

function list(req, res, next) {
    res.status(200).json({data: dishes});
}

function update(req, res, next) {
    const {data: {id, name, description, price, image_url} = {}} = req.body;
    const dishIndex = dishes.findIndex(dish => dish.id === id);
    const dishId = id ? id : req.params.dishId;
    const updatedDish = {
        id: dishId,
        name,
        description,
        price,
        image_url
    };
    dishes.splice(dishIndex, 1, updatedDish);
    res.status(200).json({data: updatedDish});
}

function create(req, res, next) {
    const {data: {name, description, price, image_url} = {}} = req.body;
    const newDishId = nextId();
    const newDish = {
        id: newDishId,
        name,
        description,
        price,
        image_url
    };
    dishes.push(newDish);
    res.status(201).json({data: newDish});
}

module.exports = {
    list,
    read: [dishExists, read],
    update: [dishExists, matchesRouteId, nameValidation, descriptionValidation, priceValidation, imageValidation, update],
    create: [nameValidation, descriptionValidation, priceValidation, imageValidation, create],
    dishExists
};
