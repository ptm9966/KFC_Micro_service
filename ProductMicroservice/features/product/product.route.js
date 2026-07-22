const express = require("express");
const Product = require("./product.model");

const productRouter = express.Router();

/**
 * @swagger
 * /api/product:
 *   get:
 *     summary: Get all products or filter by category
 *     description: Retrieve all products or filter by category
 *     tags:
 *       - Products
 *     parameters:
 *       - in: query
 *         name: categories
 *         schema:
 *           type: string
 *         description: Filter products by category
 *     responses:
 *       200:
 *         description: List of products
 *       500:
 *         description: Error retrieving products
 */
productRouter.get("/product", async (req, res) => {
    const { categories } = req.query;
    try {
        let query = {};
        if (categories) {
            query.categories = categories;
        }

        const products = await Product.find(query);
        res.status(200).send(products);
    } catch (error) {
        console.log(error);
        res.status(500).send({ "error": "Something went wrong while fetching products" });
    }
});

/**
 * @swagger
 * /api/product/search:
 *   get:
 *     summary: Search products by title
 *     description: Search products by title keyword
 *     tags:
 *       - Products
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         required: true
 *         description: Search query
 *     responses:
 *       200:
 *         description: Search results
 *       400:
 *         description: Missing search query
 *       500:
 *         description: Search error
 */
productRouter.get("/product/search", async (req, res) => {
    const { q } = req.query;
    if (!q) {
        return res.status(400).send({ "error": "Search query parameter 'q' is required" });
    }

    try {
        const products = await Product.find({
            "title": { "$regex": q, "$options": "i" }
        });
        res.status(200).send(products);
    } catch (error) {
        console.log(error);
        res.status(500).send({ "error": "Something went wrong while searching products" });
    }
});

/**
 * @swagger
 * /api/product/{productId}:
 *   get:
 *     summary: Get product by ID
 *     description: Retrieve a single product by its ID
 *     tags:
 *       - Products
 *     parameters:
 *       - in: path
 *         name: productId
 *         schema:
 *           type: string
 *         required: true
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product details
 *       404:
 *         description: Product not found
 *       500:
 *         description: Error retrieving product
 */
productRouter.get("/product/:productId", async (req, res) => {
    const { productId } = req.params;
    try {
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).send({ "error": "Product not found" });
        }
        res.status(200).send(product);
    } catch (error) {
        console.log(error);
        res.status(500).send({ "error": "Something went wrong while fetching product" });
    }
});

/**
 * @swagger
 * /api/product:
 *   post:
 *     summary: Create a new product
 *     description: Add a new product to the catalog
 *     tags:
 *       - Products
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *               - title
 *               - desc
 *               - categories
 *               - price
 *               - serve
 *               - type
 *             properties:
 *               image:
 *                 type: string
 *                 example: "https://example.com/image.jpg"
 *               title:
 *                 type: string
 *                 example: "Chicken Bucket"
 *               desc:
 *                 type: string
 *                 example: "Delicious fried chicken bucket"
 *               categories:
 *                 type: string
 *                 example: "Chicken"
 *               price:
 *                 type: number
 *                 example: 15.99
 *               serve:
 *                 type: string
 *                 example: "4 pieces"
 *               type:
 *                 type: string
 *                 example: "Non-Veg"
 *     responses:
 *       201:
 *         description: Product created successfully
 *       400:
 *         description: Product already exists or invalid data
 *       500:
 *         description: Error creating product
 */
productRouter.post("/product", async (req, res) => {
    const payload = req.body;
    const { title } = req.body;

    if (!title) {
        return res.status(400).send({ "error": "Product title is required" });
    }

    try {
        const existing = await Product.findOne({ title });
        if (existing) {
            return res.status(400).send({ "error": "Product with this title already exists" });
        }

        const newProduct = new Product(payload);
        await newProduct.save();
        res.status(201).send({ "message": "Product created successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).send({ "error": "Something went wrong while creating product" });
    }
});

/**
 * @swagger
 * /api/product/{productId}:
 *   delete:
 *     summary: Delete a product
 *     description: Delete a product by ID
 *     tags:
 *       - Products
 *     parameters:
 *       - in: path
 *         name: productId
 *         schema:
 *           type: string
 *         required: true
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *       404:
 *         description: Product not found
 *       500:
 *         description: Error deleting product
 */
productRouter.delete("/product/:productId", async (req, res) => {
    const { productId } = req.params;

    try {
        const existing = await Product.findById(productId);
        if (!existing) {
            return res.status(404).send({ "error": "Product not found" });
        }

        await Product.findByIdAndDelete(productId);
        res.status(200).send({ "message": "Product deleted successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).send({ "error": "Something went wrong while deleting product" });
    }
});

/**
 * @swagger
 * /api/product/{productId}:
 *   patch:
 *     summary: Update a product
 *     description: Update product details by ID
 *     tags:
 *       - Products
 *     parameters:
 *       - in: path
 *         name: productId
 *         schema:
 *           type: string
 *         required: true
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *               title:
 *                 type: string
 *               desc:
 *                 type: string
 *               categories:
 *                 type: string
 *               price:
 *                 type: number
 *               serve:
 *                 type: string
 *               type:
 *                 type: string
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       404:
 *         description: Product not found
 *       500:
 *         description: Error updating product
 */
productRouter.patch("/product/:productId", async (req, res) => {
    const { productId } = req.params;
    const payload = req.body;

    try {
        const existing = await Product.findById(productId);
        if (!existing) {
            return res.status(404).send({ "error": "Product not found" });
        }

        await Product.findByIdAndUpdate(productId, payload);
        res.status(200).send({ "message": "Product updated successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).send({ "error": "Something went wrong while updating product" });
    }
});

module.exports = productRouter;