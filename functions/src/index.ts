import * as functions from 'firebase-functions';
import * as admin from "firebase-admin";
import * as cors from 'cors';
import * as bcrypt from "bcrypt";
// import * as nodemailer from 'nodemailer'
import {
    validateUser,
    validateAuth,
    generateAuthToken,
    validateReset,
    validateUserUpdate,
    validateProduct,
    validateProductUpdate,
    validateCategory,
    validateOrder,
    validateOrderUpdate,
    validateOffer,
    validateCartUpdate, validateSavedUpdate
} from "./Schemas";
import {addCart, addCategory, addOffer, addOrder, addProduct, addSaved, addUser} from "./Objects";
import {auth} from "./MiddleWare";
import {generateKeywords} from "./Algo";

const corsHandler = cors({origin: true});

admin.initializeApp();

//User
export const createUser = functions.https.onRequest(async (request, response) => {
    return corsHandler(request, response, async () => {
        const {error} = validateUser(request.body);
        if (error) {
            return response.status(201).send(error.details[0].message)
        }

        const users = await admin.firestore().collection('userx').where("email", "==", request.body.email).get();
        if (users.docs.length > 0) return response.status(201).send('Email Already Registered');

        const salt = await bcrypt.genSalt(10);
        const passwordEncrypted = await bcrypt.hash(request.body.password, salt);

        const user = await admin.firestore().collection('userx').add(addUser(request.body, passwordEncrypted));
        if (request.body.role === 'CUSTOMER') {
            await admin.firestore().collection('carts').add(addCart({cid: user.id}));
            await admin.firestore().collection('saved').add(addSaved({cid: user.id}));
        }
        return response.status(200).send("User Created Successfully!");
    });
});

export const authenticate = functions.https.onRequest(async (request: any, response: any) => {
    return corsHandler(request, response, async () => {
        const {error} = validateAuth(request.body);
        if (error) {
            return response.status(201).send(error.details[0].message);
        }
        const users = await admin.firestore().collection('userx').where("email", "==", request.body.email).get();
        if (users.docs.length === 0) return response.status(201).send('Invalid Email Address');

        const userDoc = users.docs[0];
        const validPassword = await bcrypt.compare(request.body.password, userDoc.data().password);
        if (!validPassword) return response.status(201).send('Invalid Password');

        const token = generateAuthToken({id: userDoc.id, role: userDoc.data().role});
        return response.status(200).send(token);
    });
});

export const forgotPassword = functions.https.onRequest(async (request: any, response: any) => {
    return corsHandler(request, response, async () => {
        const users = await admin.firestore().collection('userx').where("email", "==", request.body.email).get();
        if (users.docs.length === 0) return response.status(201).send('Invalid Email Address');

        //TODO: Send message to resetPassword through webpage


        return response.status(200).send('Password changed successfully, Please login again');
    });
});

export const resetPassword = functions.https.onRequest(async (request: any, response: any) => {
    return corsHandler(request, response, async () => {
        const {error} = validateReset(request.body);
        if (error) {
            return response.status(201).send(error.details[0].message);
        }

        const user: any = await admin.firestore().collection('userx').doc(request.body.id).get();
        if (!user.exists) return response.status(201).send('User does not exist');

        const validPassword = await bcrypt.compare(request.body.oldPassword, user.data().password);
        if (!validPassword) return response.status(201).send('Invalid Current Password');

        const salt = await bcrypt.genSalt(10);
        const passwordEncrypted = await bcrypt.hash(request.body.password, salt);

        await admin.firestore().collection('userx').doc(request.body.id).set({
            password: passwordEncrypted
        }, {merge: true});

        return response.status(200).send('Password changed successfully, Please login again');
    });
});

export const getUsers = functions.https.onRequest(async (request: any, response: any) => {
    return corsHandler(request, response, async () => {
            const decoded = auth(request, response);
            if (decoded === undefined) {
                const users = await admin.firestore()
                    .collection('userx')
                    .orderBy('fullName', "asc")
                    .limit(50)
                    .get();

                if (users.docs.length === 0) return response.status(200).send([]);

                const list: any = [];
                users.docs.map(el => list.push({id: el.id, data: el.data()}));

                return response.status(200).send(list);
            }
            return response.status(201).send(decoded);
        }
    );
});

export const updateUser = functions.https.onRequest(async (request, response) => {
    return corsHandler(request, response, async () => {
        const decoded = auth(request, response);
        if (decoded === undefined) {
            console.log('userData', JSON.stringify(request.body));

            const {error} = validateUserUpdate(request.body);
            if (error) {
                return response.status(201).send(error.details[0].message)
            }
            const user = await admin.firestore().collection('userx').doc(request.body.id).get();
            if (!user.exists) return response.status(201).send('User does note exist or wrong id');

            const fullName = request.body.fullName;
            const contactNumber = request.body.contactNumber;
            const email = request.body.email;
            const location = request.body.location;
            const profilePic = request.body.profilePic;
            const wallet = request.body.wallet;
            const status = request.body.status;
            const data: any = {};

            if (fullName !== undefined) {
                data.fullName = fullName;
            }
            if (contactNumber !== undefined) {
                data.contactNumber = contactNumber;
            }
            if (email !== undefined) {
                data.email = email;
            }
            if (location !== undefined) {
                data.location = location;
            }
            if (profilePic !== undefined) {
                data.itemImage = profilePic;
            }
            if (wallet !== undefined) {
                data.wallet = wallet
            }
            if (status !== undefined) {
                data.status = status;
            }

            await admin.firestore().collection('userx').doc(request.body.id).set(data, {merge: true});

            return response.status(200).send('user Updated');
        }
        return response.status(201).send(decoded);
    });
});

//Products

export const createProduct = functions.https.onRequest(async (request, response) => {
    return corsHandler(request, response, async () => {
        const decoded = auth(request, response);
        if (decoded === undefined) {
            const {error} = validateProduct(request.body);
            if (error) {
                return response.status(201).send(error.details[0].message)
            }

            const user = await admin.firestore().collection('userx').doc(request.body.vid).get();
            if (!user.exists) return response.status(201).send('Vendor does not exist or wrong id');

            const products = await admin.firestore()
                .collection('products')
                .where("name", "==", request.body.name)
                .where('vid', '==', request.body.vid)//vid = vendor id
                .where('manufacturer', '==', request.body.manufacturer)
                .get();
            if (products.docs.length > 0) return response.status(201).send('Product with same attributes already exist');

            let keywords: Array<string> = generateKeywords(request.body.name).concat(generateKeywords(request.body.brand));

            await admin.firestore().collection('products').add(addProduct(request.body, keywords));
            return response.status(200).send("Product Created Successfully!");
        }
        return response.status(201).send(decoded);

    });
});

export const getProducts = functions.https.onRequest(async (request: any, response: any) => {
    return corsHandler(request, response, async () => {
            const decoded = auth(request, response);
            if (decoded === undefined) {
                const products = await admin.firestore()
                    .collection('products')
                    .orderBy('name', "asc")
                    .limit(50)
                    .get();

                if (products.docs.length === 0) return response.status(200).send([]);

                const list: any = [];
                products.docs.map(el => list.push({id: el.id, data: el.data()}));

                return response.status(200).send(list);
            }
            return response.status(201).send(decoded);
        }
    );
});

export const updateProduct = functions.https.onRequest(async (request, response) => {
    return corsHandler(request, response, async () => {
        const decoded = auth(request, response);
        if (decoded === undefined) {
            console.log('productDataUpdated', JSON.stringify(request.body));

            const {error} = validateProductUpdate(request.body);
            if (error) {
                return response.status(201).send(error.details[0].message)
            }
            const product = await admin.firestore().collection('products').doc(request.body.id).get();
            if (!product.exists) return response.status(201).send('product does not exist or wrong id');

            const name = request.body.name;
            const images = request.body.images;
            const price = request.body.price;
            const offer = request.body.offer;
            const qty = request.body.qty;
            const description = request.body.description;
            const features = request.body.features;
            const life = request.body.life;
            const otherNames = request.body.otherNames;
            const rating = request.body.rating;
            const status = request.body.status;

            const data: any = {};

            if (name !== undefined) {
                data.name = name;
            }
            if (images !== undefined) {
                data.images = images;
            }
            if (price !== undefined) {
                data.price = price;
            }
            if (offer !== undefined) {
                data.offer = offer;
            }
            if (qty !== undefined) {
                data.qty = qty;
            }
            if (description !== undefined) {
                data.description = description
            }
            if (features !== undefined) {
                data.features = features
            }
            if (life !== undefined) {
                data.life = life
            }
            if (otherNames !== undefined) {
                data.otherNames = otherNames
            }
            if (rating !== undefined) {
                data.rating = rating
            }
            if (status !== undefined) {
                data.status = status;
            }

            await admin.firestore().collection('products').doc(request.body.id).set(data, {merge: true});

            return response.status(200).send('product Updated');
        }
        return response.status(201).send(decoded);
    });
});

//Product Categories

export const createCategory = functions.https.onRequest(async (request, response) => {
    return corsHandler(request, response, async () => {
        const decoded = auth(request, response);
        if (decoded === undefined) {
            const {error} = validateCategory(request.body);
            if (error) {
                return response.status(201).send(error.details[0].message)
            }

            const categories = await admin.firestore()
                .collection('categories')
                .where("name", "==", request.body.name)
                .get();
            if (categories.docs.length > 0) return response.status(201).send('Category with same attributes already exist');

            await admin.firestore().collection('categories').add(addCategory(request.body));
            return response.status(200).send("Category created successfully!");
        }
        return response.status(201).send(decoded);
    });
});

export const getCategories = functions.https.onRequest(async (request: any, response: any) => {
    return corsHandler(request, response, async () => {
            const decoded = auth(request, response);
            if (decoded === undefined) {
                const categories = await admin.firestore()
                    .collection('categories')
                    .orderBy('name', "asc")
                    .limit(50)
                    .get();

                if (categories.docs.length === 0) return response.status(200).send([]);

                const list: any = [];
                categories.docs.map(el => list.push({id: el.id, data: el.data()}));

                return response.status(200).send(list);
            }
            return response.status(201).send(decoded);
        }
    );
});

export const deleteCategory = functions.https.onRequest(async (request, response) => {
    return corsHandler(request, response, async () => {
        const decoded = auth(request, response);
        if (decoded === undefined) {

            const category = await admin.firestore().collection('categories').doc(request.body.id).get();
            if (!category.exists) return response.status(201).send('category does not exist or wrong id');

            await admin.firestore().collection('categories').doc(request.body.id).delete();

            return response.status(200).send('Category Deleted');
        }
        return response.status(201).send(decoded);
    });
});

//Offers/Discount

export const createOffer = functions.https.onRequest(async (request, response) => {
    return corsHandler(request, response, async () => {
        const decoded = auth(request, response);
        if (decoded === undefined) {
            const {error} = validateOffer(request.body);
            if (error) {
                return response.status(201).send(error.details[0].message)
            }

            const categories = await admin.firestore()
                .collection('offers')
                .where("name", "==", request.body.name)
                .where("code", "==", request.body.code)
                .get();
            if (categories.docs.length > 0) return response.status(201).send('Offer with same attributes already exist');

            await admin.firestore().collection('offers').add(addOffer(request.body));
            return response.status(200).send("Offer created successfully!");
        }
        return response.status(201).send(decoded);
    });
});

export const getOffers = functions.https.onRequest(async (request: any, response: any) => {
    return corsHandler(request, response, async () => {
            const decoded = auth(request, response);
            if (decoded === undefined) {
                const categories = await admin.firestore()
                    .collection('offers')
                    .orderBy('name', "asc")
                    .limit(50)
                    .get();

                if (categories.docs.length === 0) return response.status(200).send([]);

                const list: any = [];
                categories.docs.map(el => list.push({id: el.id, data: el.data()}));

                return response.status(200).send(list);
            }
            return response.status(201).send(decoded);
        }
    );
});

export const deleteOffer = functions.https.onRequest(async (request, response) => {
    return corsHandler(request, response, async () => {
        const decoded = auth(request, response);
        if (decoded === undefined) {

            const category = await admin.firestore().collection('offers').doc(request.body.id).get();
            if (!category.exists) return response.status(201).send('Offer does not exist or wrong id');

            await admin.firestore().collection('offers').doc(request.body.id).delete();

            return response.status(200).send('Offer Deleted');
        }
        return response.status(201).send(decoded);
    });
});

//Orders

export const createOrder = functions.https.onRequest(async (request, response) => {
    return corsHandler(request, response, async () => {
        const decoded = auth(request, response);
        if (decoded === undefined) {
            const {error} = validateOrder(request.body);
            if (error) {
                return response.status(201).send(error.details[0].message)
            }

            const user = await admin.firestore().collection('userx').doc(request.body.cid).get();
            if (!user.exists) return response.status(201).send('customer does not exist or wrong id');


            let keywords: Array<string> = generateKeywords(request.body.customerName).concat(generateKeywords(request.body.contact)).concat(generateKeywords(request.body.email));

            await admin.firestore().collection('orders').add(addOrder(request.body, keywords));
            return response.status(200).send("Order Created Successfully!");
        }
        return
        return response.status(201).send(decoded);

    });
});

export const getOrders = functions.https.onRequest(async (request: any, response: any) => {
    return corsHandler(request, response, async () => {
            const decoded = auth(request, response);
            if (decoded === undefined) {
                const products = await admin.firestore()
                    .collection('orders')
                    .orderBy('createdAt', "asc")
                    .limit(50)
                    .get();

                if (products.docs.length === 0) return response.status(200).send([]);

                const list: any = [];
                products.docs.map(el => list.push({id: el.id, data: el.data()}));

                return response.status(200).send(list);
            }
            return response.status(201).send(decoded);
        }
    );
});

export const updateOrder = functions.https.onRequest(async (request, response) => {
    return corsHandler(request, response, async () => {
        const decoded = auth(request, response);
        if (decoded === undefined) {
            console.log('orderDataUpdated', JSON.stringify(request.body));

            const {error} = validateOrderUpdate(request.body);
            if (error) {
                return response.status(201).send(error.details[0].message)
            }
            const order = await admin.firestore().collection('orders').doc(request.body.id).get();
            if (!order.exists) return response.status(201).send('order does not exist or wrong id');

            const customerName = request.body.customerName;
            const contact = request.body.contact;
            const email = request.body.email;
            const location = request.body.location;
            const items = request.body.items;
            const totalCost = request.body.totalCost;
            const offer = request.body.offer;
            const discount = request.body.discount;
            const finalCost = request.body.finalCost;
            const orderRating = request.body.orderRating;
            const deliveryRating = request.body.deliveryRating;
            const vendorRating = request.body.vendorRating;
            const status = request.body.status;
            const comment = request.body.comment;
            const paymentType = request.body.paymentType;
            const timeDelivered = request.body.timeDelivered;
            const deliveryBoy = request.body.deliveryBoy;
            const vendor = request.body.vendor;
            const vendorName = request.body.vendorName;

            const data: any = {};

            if (customerName !== undefined) {
                data.customerName = customerName;
            }
            if (contact !== undefined) {
                data.contact = contact;
            }
            if (email !== undefined) {
                data.email = email;
            }
            if (offer !== undefined) {
                data.offer = offer;
            }
            if (location !== undefined) {
                data.location = location;
            }
            if (items !== undefined) {
                data.items = items
            }
            if (totalCost !== undefined) {
                data.totalCost = totalCost
            }
            if (discount !== undefined) {
                data.discount = discount
            }
            if (finalCost !== undefined) {
                data.finalCost = finalCost
            }
            if (orderRating !== undefined) {
                data.orderRating = orderRating
            }
            if (deliveryRating !== undefined) {
                data.deliveryRating = deliveryRating
            }
            if (vendorRating !== undefined) {
                data.vendorRating = vendorRating
            }
            if (status !== undefined) {
                data.status = status;
            }
            if (comment !== undefined) {
                data.comment = comment
            }
            if (paymentType !== undefined) {
                data.paymentType = paymentType
            }
            if (timeDelivered !== undefined) {
                data.timeDelivered = timeDelivered
            }
            if (deliveryBoy !== undefined) {
                data.deliveryBoy = deliveryBoy
            }
            if (vendor !== undefined) {
                data.vendor = vendor
            }
            if (vendorName !== undefined) {
                data.vendorName = vendorName
            }

            await admin.firestore().collection('orders').doc(request.body.id).set(data, {merge: true});

            return response.status(200).send('product Updated');
        }
        return response.status(201).send(decoded);
    });
});

//Cart

export const updateCart = functions.https.onRequest(async (request, response) => {
    return corsHandler(request, response, async () => {
        const decoded = auth(request, response);
        if (decoded === undefined) {
            console.log('cartDataUpdated', JSON.stringify(request.body));

            const {error} = validateCartUpdate(request.body);
            if (error) {
                return response.status(201).send(error.details[0].message)
            }
            const product = await admin.firestore().collection('carts').doc(request.body.id).get();
            if (!product.exists) return response.status(201).send('cart does not exist or wrong id');

            const items = request.body.items;
            const offer = request.body.offer;
            const totalCost = request.body.totalCost;
            const discount = request.body.discount;

            const data: any = {};
            if (items !== undefined) {
                data.images = items;
            }
            if (offer !== undefined) {
                data.offer = offer;
            }
            if (totalCost !== undefined) {
                data.totalCost = totalCost;
            }
            if (discount !== undefined) {
                data.discount= discount;
            }

            await admin.firestore().collection('carts').doc(request.body.id).set(data, {merge: true});

            return response.status(200).send('Cart Updated');
        }
        return response.status(201).send(decoded);
    });
});

//Saved

export const updateSaved = functions.https.onRequest(async (request, response) => {
    return corsHandler(request, response, async () => {
        const decoded = auth(request, response);
        if (decoded === undefined) {
            console.log('savedDateUpdated', JSON.stringify(request.body));

            const {error} = validateSavedUpdate(request.body);
            if (error) {
                return response.status(201).send(error.details[0].message)
            }
            const product = await admin.firestore().collection('saved').doc(request.body.id).get();
            if (!product.exists) return response.status(201).send('Saved does not exist or wrong id');

            const items = request.body.items;

            const data: any = {};

            if (items !== undefined) {
                data.items = items;
            }


            await admin.firestore().collection('saved').doc(request.body.id).set(data, {merge: true});

            return response.status(200).send('Saved Updated');
        }
        return response.status(201).send(decoded);
    });
});
