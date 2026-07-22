const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
    {
        image: {
            type: String,
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        desc: {
            type: String,
            required: true,
        },
        categories: {
            type: String,
            required: true,
        },
        price: {
            type: Number,
            required: true,
        },
        serve: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            required: true,
        },
    },
    {
        versionKey: false,
        timestamps: true,
    }
)

const Product = mongoose.model("product", productSchema);
module.exports = Product;