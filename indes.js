const express = require("express");
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 3500;
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
// Connect to react-app | middleware
app.use(cors());
app.use(express.json());

// Verify JWT
function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ massage: "unauthorized" });
    }
    const token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).send({ massage: "Forbidden access" });
        }
        // console.log("decoded", decoded);
        req.decoded = decoded;
        console.log("Inside JWTVerify", authHeader);
        next();
    });
}

const uri = `mongodb+srv://${process.env.DB_ID}:${process.env.DB_PASSWORD}@cluster0.je7gu.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverApi: ServerApiVersion.v1,
});

async function runDB() {
    try {
        await client.connect();
        console.log("mongodb connected");
        const database = client.db("Assignment11").collection("AllFruits");
        // Auth
        app.post("/login", async (req, res) => {
            const user = req.body;
            const accessToken = jwt.sign(
                user,
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: "99d" }
            );
            res.send({ accessToken });
            console.log(user);
        });

        // Add New Product
        app.post("/addProduct", async (req, res) => {
            const productData = req.body;
            database.insertOne(productData.userData);
            res.send("Your Product is Successfully saved.");
        });

        // Get All Product
        app.get("/products", async (req, res) => {
            let query = {};
            // console.log(email, query);
            const cursor = database.find(query);
            const result = await cursor.toArray();
            // console.log(result);
            res.send(result);
        });
        // Get All Product
        // Verify jwt is off
        app.get("/myItem", async (req, res) => {
            // const decodedEmail = req.decoded.email;
            // console.log(decodedEmail);
            const email = req.query.email;
            let query = {};
            if (email) {
                query = { email: email };
            }
            // console.log(email, query);
            const cursor = database.find(query);
            const result = await cursor.toArray();
            // console.log(result);
            res.send(result);
        });

        // Delete User
        app.delete("/products/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await database.deleteOne(query);
            res.send(result);
        });

        // Find One Data
        app.get("/products/:id", async (req, res) => {
            const id = req.params.id;
            // console.log(id);
            const query = { _id: ObjectId(id) };
            const result = await database.findOne(query);
            res.send(result);
        });

        // Update || PUT
        app.put("/products/:id", async (req, res) => {
            const id = req.params.id;
            const updateData = req.body;
            // console.log(updateData);
            const query = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    name: updateData.name,
                    email: updateData.email,
                    productName: updateData.productName,
                    productImg: updateData.productImg,
                    productDescription: updateData.productDescription,
                    productQuantity: updateData.productQuantity,
                    productPrice: updateData.productPrice,
                },
            };
            // console.log(updateDoc);
            const result = await database.updateOne(query, updateDoc, options);
            // console.log(
            //     `${result.matchedCount} document(s) matched the filter, updated ${result.modifiedCount} document(s)`
            // );
            res.send(result);
        });
    } finally {
        // await client.close();
    }
}

runDB().catch(console.dir);

app.get("/", (req, res) => {
    res.send("Node server is working");
});

app.listen(port, () => {
    console.log("Listening", port);
});
