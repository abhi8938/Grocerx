import * as Joi from "joi";
import * as jwt from "jsonwebtoken";
import * as functions from 'firebase-functions';

const locationSchema = Joi.object().keys({
    lat: Joi.number().required(),
    long: Joi.number().required(),
    address: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    country: Joi.string().required(),
    pinCode: Joi.number().required(),
});

const item = Joi.object().keys({
    id: Joi.string().required(),
    qty: Joi.number().required(),
    price: Joi.number().required(),
    name: Joi.string().required(),
    unit:Joi.string().required()
})

export const validateUser = function (body: any) {
    let schema = {}
    const role: string = body.role;

    switch (role) {
        case 'VENDOR':
            schema = Joi.object().keys({
                fullName: Joi.string().required(),
                contactNumber: Joi.string().required().min(10).max(10),
                email: Joi.string().min(5).required().email(),
                password: Joi.string().min(5).max(255).required(),
                location: locationSchema,
                role: Joi.string().required(),
                profilePic: Joi.string().required(),
            });
            break;
        case 'EMPLOYEE':
            schema = Joi.object().keys({
                fullName: Joi.string().required(),
                contactNumber: Joi.string().required().min(10).max(10),
                email: Joi.string().min(5).required().email(),
                password: Joi.string().min(5).max(255).required(),
                role: Joi.string().required(),
                profilePic: Joi.string().required(),
                location: locationSchema,
            });
            break;
        case 'DELIVERY':
            schema = Joi.object().keys({
                fullName: Joi.string().required(),
                contactNumber: Joi.string().required().min(10).max(10),
                email: Joi.string().min(5).required().email(),
                password: Joi.string().min(5).max(255).required(),
                role: Joi.string().required(),
                location: locationSchema,
                profilePic: Joi.string().required()
            });
            break;
        default:
            schema = Joi.object().keys({
                fullName: Joi.string().required(),
                contactNumber: Joi.string().required().min(10).max(10),
                location: Joi.alternatives(locationSchema, Joi.array().items(locationSchema)).required(),
                email: Joi.string().min(5).required().email(),
                password: Joi.string().min(5).max(255).required(),
                wallet: Joi.number(),
                role: Joi.string().required(),
            });
    }


    return Joi.validate(body, schema);
};

export const validateAuth = function (body: any) {
    const Schema = Joi.object().keys({
        email: Joi.string().min(5).required().email(),
        password: Joi.string().min(5).max(255).required(),
    });
    return Joi.validate(body, Schema);
};

export const validateReset = function (body: any) {
    const Schema = Joi.object().keys({
        password: Joi.string().min(5).max(255).required(),
        oldPassword: Joi.string().min(5).max(255).required(),
        id: Joi.string().required(),
    });
    return Joi.validate(body, Schema);
};

export const generateAuthToken = function (user: { id: string, role: string }) {
    const secretKey = functions.config().authkey.key;
    return jwt.sign(user, secretKey);
};

export const validateUserUpdate = function (body: any) {
    let schema = Joi.object().keys({
        fullName: Joi.string(),
        contactNumber: Joi.string().min(10).max(10),
        location: Joi.alternatives(locationSchema, Joi.array().items(locationSchema)),
        email: Joi.string().min(5).email(),
        wallet: Joi.number(),
        profilePic: Joi.string(),
        status: Joi.string(),
        id: Joi.string()
    });

    return Joi.validate(body, schema);
};

export const validateProduct = function (body: any) {
    let schema = Joi.object().keys({
        name: Joi.string().required(),
        manufacturer: Joi.string().required(),
        brand: Joi.string().required(),
        vid: Joi.string().required(),
        images: Joi.array().items(Joi.string()).required(),
        price: Joi.number().required(),
        offer: Joi.object().keys({
            name: Joi.string(),
            id: Joi.string()
        }).required(),
        qty: Joi.object().keys({
            value: Joi.number(),
            unit: Joi.string()
        }),
        description: Joi.string().required(),
        features: Joi.string().required(),
        otherNames: Joi.alternatives(Joi.array().items(Joi.string()), Joi.string()),
        life: Joi.string().required(),
        rating: Joi.number().required(),
        category: Joi.string().required(),
        status: Joi.string(),

    });

    return Joi.validate(body, schema);
};

export const validateProductUpdate = function (body: any) {
    let schema = Joi.object().keys({
        name: Joi.string(),
        id: Joi.string().required(),
        images: Joi.array().items(Joi.string()),
        price: Joi.number(),
        offer: Joi.object().keys({
            name: Joi.string(),
            id: Joi.string()
        }),
        qty: Joi.object().keys({
            value: Joi.number(),
            unit: Joi.string()
        }),
        description: Joi.string(),
        features: Joi.string(),
        otherNames: Joi.array().items(Joi.string()),
        life: Joi.string(),
        rating: Joi.number(),
        status: Joi.string()
    });

    return Joi.validate(body, schema);
};

export const validateCategory = function (body: any) {
    let schema = Joi.object().keys({
        name: Joi.string().required(),
        image: Joi.string().required(),
        offer: Joi.string(),
        description: Joi.string().required()
    });

    return Joi.validate(body, schema);
};

export const validateOrder = function (body: any) {
    let schema = Joi.object().keys({
        customerName: Joi.string().required(),
        contact: Joi.string().required(),
        email: Joi.string().min(5).required().email(),
        cid: Joi.string().required(),
        location: locationSchema,
        vid: Joi.string(),
        items: Joi.array().items(item).required(),
        totalCost: Joi.number().required(),
        offer: Joi.object().keys({
            name: Joi.string(),
            id: Joi.string()
        }).required(),
        discount: Joi.number().required(),
        finalCost: Joi.number().required(),
        orderRating: Joi.number(),
        deliveryRating: Joi.number(),
        vendorRating: Joi.number(),
        status: Joi.string(),
        comment: Joi.string(),
        paymentStatus: Joi.string().required(),
        paymentType: Joi.string().required(),
        timeAssigned: Joi.date().required(),
        timeDelivered: Joi.date(),
        deliveryBoy: Joi.string(),
        did: Joi.string(),
        vendor: Joi.object().keys({
            contact: Joi.string().required(),
            email: Joi.string().min(5).email().required(),
        }),
        vendorName: Joi.string(),
    });

    return Joi.validate(body, schema);
};

export const validateOrderUpdate = function (body: any) {
    let schema = Joi.object().keys({
        id:Joi.string().required(),
        customerName: Joi.string(),
        contact: Joi.string(),
        email: Joi.string().min(5).email(),
        cid: Joi.string(),
        location: locationSchema,
        vid: Joi.string(),
        items: Joi.array().items(item),
        totalCost: Joi.number(),
        offer: Joi.object().keys({
            name: Joi.string(),
            id: Joi.string()
        }),
        discount: Joi.number(),
        finalCost: Joi.number(),
        orderRating: Joi.number(),
        deliveryRating: Joi.number(),
        vendorRating: Joi.number(),
        status: Joi.string(),
        comment: Joi.string(),
        paymentStatus: Joi.string(),
        paymentType: Joi.string(),
        timeAssigned: Joi.date(),
        timeDelivered: Joi.date(),
        deliveryBoy: Joi.string(),
        did: Joi.string(),
        vendor: Joi.object().keys({
            contact: Joi.string(),
            email: Joi.string().min(5).email(),
        }),
        vendorName: Joi.string(),
    });

    return Joi.validate(body, schema);
};

export const validateOffer = function (body: any) {
    let schema = Joi.object().keys({
        name: Joi.string().required(),
        discount: Joi.number().required(),
        unit: Joi.string().required(),
        code: Joi.string().required()
    });

    return Joi.validate(body, schema);
};

export const validateCartUpdate = function (body: any) {
    let schema = Joi.object().keys({
        id:Joi.string().required(),
        items:Joi.array().items(item).required(),
        totalCost:Joi.number(),
        offer:Joi.object().keys({
            name: Joi.string(),
            id: Joi.string()
        }),
        discount:Joi.number(),
        cid:Joi.string()
    });

    return Joi.validate(body, schema);
};

export const validateSavedUpdate = function (body: any) {
    let schema = Joi.object().keys({
        id:Joi.string().required(),
        items:Joi.array().items(item).required(),
        cid:Joi.string()
    });

    return Joi.validate(body, schema);
};
