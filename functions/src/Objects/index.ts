import * as admin from "firebase-admin";

type location = {
    lat: number,
    long: number,
    address: string,
    city: string,
    state: string,
    country: string,
    pinCode: number,
};

type item = {
    id: string,
    qty: number,
    price: number,
    name: string,
    unit: string
}

export const addUser = function (body: {
    fullName: string,
    contactNumber: string,
    email: string,
    role: string,
    location?: location,
    profilePic?: string,
    wallet?: number
}, passwordEncrypted: string) {
    let role = body.role;
    let data = {};
    switch (role) {

        case 'VENDOR':
            data = {
                fullName: body.fullName,
                contactNumber: body.contactNumber,
                email: body.email,
                password: passwordEncrypted,
                role: body.role,
                location: body.location,
                profilePic: body.profilePic,
                status: 'ACTIVE',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                onDuty:false
            }
            break;
        case 'EMPLOYEE':
            data = {
                fullName: body.fullName,
                contactNumber: body.contactNumber,
                email: body.email,
                password: passwordEncrypted,
                role: body.role,
                location: body.location,
                profilePic: body.profilePic,
                status: 'ACTIVE',
                onDuty:false,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            }
            break;
        case 'DELIVERY':
            data = {
                fullName: body.fullName,
                contactNumber: body.contactNumber,
                email: body.email,
                password: passwordEncrypted,
                role: body.role,
                location: body.location,
                profilePic: body.profilePic,
                status: 'ACTIVE',
                onDuty:false,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            }
            break;
        default:
            data = {
                fullName: body.fullName,
                contactNumber: body.contactNumber,
                email: body.email,
                password: passwordEncrypted,
                role: body.role,
                location: body.location,
                wallet: 0,
                status: 'ACTIVE',
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            }
    }
    return data
};

export const addProduct = function (body: {
    name: string,
    manufacturer: string,
    brand: string,
    category: string,
    vid: string,
    images?: Array<string>,
    price: number,
    offer: {
        name: string,
        id: string
    },
    qty: {
        value: number,
        unit: string
    },
    description: string,
    features: string,
    otherNames: Array<string>,
    life: string,
    rating: number,

}, keywords: Array<string>) {
    return {
        name: body.name,
        code: body.name.toUpperCase(),
        manufacturer: body.manufacturer,
        category: body.category,
        brand: body.brand,
        vid: body.vid,
        images: body.images,
        price: body.price,
        offer: body.offer,
        qty: body.qty,
        description: body.description,
        features: body.features,
        otherNames: body.otherNames,
        life: body.life,
        rating: body.rating,
        keywords: keywords,
        status: 'AVAILABLE',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    }
}

export const addCategory = function (body: {
    name: string,
    description: string,
    image: string,
    offer?: string
}) {
    const data: any = {
        name: body.name,
        description: body.description,
        image: body.image,
    }

    if (body.offer !== undefined) {
        data.offer = body.offer
    }

    return data
}

export const addOrder = function (body: {
    customerName: string,
    contact: string,
    email: string,
    cid: string,
    location: location,
    items: Array<item>,
    totalCost: number,
    finalCost: number,
    paymentStatus: string,
    paymentType: string,
    timeAssigned: Date,
    offer?: {
        name: string,
        id: string
    },
    discount?: number,
    vendor?: {
        contact: string,
        email: string
    },
    vendorName?: string,
    vid?: string,
    orderRating?: number,
    deliveryRating?: number,
    vendorRating?: number,
    status?: string,
    comment?: string,
    timeDelivered?: Date,
    deliveryBoy?: string,
    did?: string

}, keywords: Array<string>) {
    return {
        customerName: body.customerName,
        contact: body.contact,
        email: body.email,
        cid: body.cid,
        location: body.location,
        items: body.items,
        totalCost: body.totalCost,
        finalCost: body.finalCost,
        orderRating: 0,
        deliveryRating: 0,
        vandorRating: 0,
        status: 'PLACED',
        paymentStatus: body.paymentStatus,
        paymentType: body.paymentType,
        timeAssigned: body.timeAssigned,
        keywords,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    }
}

export const addOffer = function (body: {
    name: string,
    code: string,
    discount: number,
    unit: string
}) {
    const data: any = {
        name: body.name,
        code: body.code,
        discount: body.discount,
        unit: body.unit,
        createdAt: admin.firestore.FieldValue.serverTimestamp()

    }

    return data
}

export const addCart = function (body: {
    cid: string
}) {
    const data: any = {
        items: [],
        totalCost: 0,
        offer: 'NA',
        discount: 0,
        cid: body.cid,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    }

    return data
}

export const addSaved = function (body: {
    cid: string
}) {
    const data: any = {
        items: [],
        cid: body.cid,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    }
    return data
}