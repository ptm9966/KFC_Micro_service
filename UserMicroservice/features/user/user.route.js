const express = require("express");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Users = require("./user.model");

const userRouter = express.Router();

const hashPassword = (password, salt = crypto.randomBytes(16).toString("hex")) => ({
    salt,
    passwordHash: crypto.scryptSync(password, salt, 64).toString("hex"),
});

const isPasswordValid = (password, user) => {
    if (!password || !user?.passwordHash || !user?.passwordSalt) {
        return false;
    }

    const suppliedHash = crypto.scryptSync(password, user.passwordSalt, 64);
    const storedHash = Buffer.from(user.passwordHash, "hex");

    return storedHash.length === suppliedHash.length && crypto.timingSafeEqual(storedHash, suppliedHash);
};

const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET || 'default-secret', { expiresIn: '24h' });
};

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User login
 *     description: Login user with mobile number and password
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               mobile:
 *                 type: string
 *                 example: "9876543210"
 *               password:
 *                 type: string
 *                 example: "secret123"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *       401:
 *         description: Invalid credentials
 */
userRouter.post("/login", async (req, res) => {
    const { mobile, password } = req.body;

    if (!mobile || !password) {
        return res.status(400).send({ message: "Mobile and password are required" });
    }

    try {
        let user = await Users.findOne({ mobile });

        if (!user || !isPasswordValid(password, user)) {
            return res.status(401).send({ message: "Invalid mobile number or password" });
        }

        const token = generateToken(user.id);
        const userResponse = {
            id: user.id,
            name: user.name,
            email: user.email,
            mobile: user.mobile
        };

        res.send({
            token,
            user: userResponse,
            message: "Login successful"
        });
    } catch (e) {
        res.status(500).send({ message: "Login failed", error: e.message });
    }
});

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: User registration
 *     description: Create a new user account
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 example: "john@example.com"
 *               mobile:
 *                 type: string
 *                 example: "9876543210"
 *               password:
 *                 type: string
 *                 example: "secret123"
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: User with email or mobile already exists
 */
userRouter.post("/signup", async (req, res) => {
    const { name, email, mobile, password } = req.body;

    if (!name || !email || !mobile || !password) {
        return res.status(400).send({ message: "Name, email, mobile, and password are required" });
    }

    try {
        let existingUser = await Users.findOne({ $or: [{ email }, { mobile }] });
        if (existingUser) {
            return res.status(400).send({ message: "Cannot create user with existing email or mobile" });
        }

        const { passwordHash, salt: passwordSalt } = hashPassword(password);
        let user = await Users.create({
            name, email, mobile, passwordHash, passwordSalt
        });

        const token = generateToken(user.id);
        const userResponse = {
            id: user.id,
            name: user.name,
            email: user.email,
            mobile: user.mobile
        };

        res.status(201).send({
            token,
            user: userResponse,
            message: "Signup successful"
        });
    } catch (e) {
        if (e.code === 11000) {
            return res.status(400).send({ message: "Email or mobile already exists" });
        }
        res.status(500).send({ message: "Signup failed", error: e.message });
    }
});

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     summary: Get user profile
 *     description: Get current user profile information
 *     tags:
 *       - Authentication
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved
 *       401:
 *         description: Unauthorized
 */
userRouter.get("/profile", async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).send({ message: "Authorization token required" });
        }

        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');

        const user = await Users.findById(decoded.userId).select("-passwordHash -passwordSalt");
        if (!user) {
            return res.status(404).send({ message: "User not found" });
        }

        res.send({
            id: user.id,
            name: user.name,
            email: user.email,
            mobile: user.mobile,
            createdAt: user.createdAt
        });
    } catch (e) {
        res.status(401).send({ message: "Invalid token", error: e.message });
    }
});

/**
 * @swagger
 * /auth/verify:
 *   post:
 *     summary: Verify user token
 *     description: Verify if user token is valid and return user info
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token is valid
 *       401:
 *         description: Invalid token
 */
userRouter.post("/verify", async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).send({ message: "Token is required" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
        const user = await Users.findById(decoded.userId).select("-passwordHash -passwordSalt");

        if (!user) {
            return res.status(404).send({ message: "User not found" });
        }

        res.send({
            valid: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                mobile: user.mobile
            }
        });
    } catch (e) {
        res.status(401).send({ message: "Invalid token", error: e.message });
    }
});

/**
 * @swagger
 * /auth/singleuser:
 *   post:
 *     summary: Get user details from token or ID
 *     description: Return the current user profile using the JWT token or the user ID.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 example: "<jwt-token> or <user-id>"
 *     responses:
 *       200:
 *         description: User details retrieved
 *       404:
 *         description: User not found
 */
userRouter.post("/singleuser", async (req, res) => {
    const { id } = req.body;

    if (!id) {
        return res.status(400).send({ message: "User token or ID is required" });
    }

    try {
        let user;

        if (typeof id === "string" && id.split(".").length === 3) {
            const decoded = jwt.verify(id, process.env.JWT_SECRET || 'default-secret');
            user = await Users.findById(decoded.userId).select("-passwordHash -passwordSalt");
        } else {
            user = await Users.findById(id).select("-passwordHash -passwordSalt");
        }

        if (!user) {
            return res.status(404).send({ message: "User not found" });
        }

        res.send(user);
    } catch (error) {
        res.status(404).send({ message: "Please enter correct token or user ID" });
    }
});

module.exports = userRouter;

/**
 * @swagger
 * /auth/healthz:
 *   get:
 *     summary: Health check for User microservice
 *     description: Returns service and database connection status
 *     tags:
 *       - Authentication
 *     responses:
 *       200:
 *         description: Service is healthy
 */
userRouter.get('/healthz', (req, res) => {
    const dbState = mongoose.connection && mongoose.connection.readyState;
    const dbStatus = dbState === 1 ? 'connected' : (dbState === 0 ? 'disconnected' : 'connecting/unknown');

    res.status(200).json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        db: dbStatus
    });
});