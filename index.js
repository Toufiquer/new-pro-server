const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 3500;
const { MongoClient, ServerApiVersion } = require("mongodb");
// Middle were;
app.use(express.json());
app.use(cors());

const uri = `mongodb+srv://${process.env.APP_USER}:${process.env.APP_PASSWORD}@cluster0.qlqtd.mongodb.net/?retryWrites=true&w=majority`;
async function runServer() {
    const client = new MongoClient(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverApi: ServerApiVersion.v1,
    });
    try {
        await client.connect();
        app.get("/service", async (req, res) => {
            const servicesCollection = client
                .db("servicesCollection")
                .collection("services");
            const query = {};
            const cursor = servicesCollection.find(query);
            const collection = await cursor.toArray();
            res.send(collection);
        });
        app.get("/serviceSlot", async (req, res) => {
            const servicesCollection = client
                .db("servicesSlots")
                .collection("slots");
            const query = {};
            const cursor = servicesCollection.find(query);
            const collection = await cursor.toArray();
            res.send(collection);
        });

        app.post("/booking", async (req, res) => {
            const bookingCollection = client
                .db("bookingCollection")
                .collection("booking");
            const booking = req.body;
            console.log(booking);
            const query = {};
            const result = await bookingCollection.insertOne(booking);
            res.send(result);
        });
        app.get("/", (req, res) => {
            res.send("Node is working.");
        });
    } finally {
    }
}
runServer().catch(console.error);
app.listen(port, () => {
    console.log("listening to the port ", port);
});
