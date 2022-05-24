const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 3500;
const { MongoClient, ServerApiVersion } = require("mongodb");
// Middle were;
app.use(express.json());
app.use(cors());

const verifyJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: "UnAuthorized Access" });
    }
    const token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: "Forbidden Access" });
        }
        req.decoded = decoded;
        next();
    });
};

const uri = `mongodb+srv://${process.env.APP_USER}:${process.env.APP_PASSWORD}@cluster0.qlqtd.mongodb.net/?retryWrites=true&w=majority`;
async function runServer() {
    const client = new MongoClient(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverApi: ServerApiVersion.v1,
    });
    try {
        await client.connect();

        const servicesCollection = client
            .db("servicesCollection")
            .collection("services");
        const bookingCollection = client
            .db("bookingCollection")
            .collection("booking");
        const userCollection = client.db("userCollection").collection("user");

        // add User
        app.put("/user", async (req, res) => {
            const name = req.body.name;
            const email = req.body.email;
            const user = { name, email, role: "" };
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = { $set: user };
            const result = await userCollection.updateOne(
                filter,
                updateDoc,
                options
            );
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN, {
                expiresIn: "1h",
            });
            res.send({ result, token });
        });

        app.get("/available", async (req, res) => {
            // working
            const date = req.query.date || "May 23, 2022";
            console.log(req.query);
            const services = await servicesCollection.find().toArray();
            const query = { date: date };
            const booking = await bookingCollection.find(query).toArray();

            services.forEach(service => {
                const serviceBooking = booking.filter(
                    b => b.treatment === service.name
                );
                const booked = serviceBooking.map(s => s.slot);
                service.booked = booked;
                const available = service.slots.filter(
                    slot => !booked.includes(slot)
                );
                service.available = available;
            });

            res.send(services);
            // -- -- -- -- -
        });
        app.get("/dashboard", verifyJWT, async (req, res) => {
            const patient = req.query.treatment;

            console.log(req.decoded);
            const decodedEmail = req.decoded.email;
            if (patient === decodedEmail) {
                // const tokenBearer = req.headers.authorization;
                // const token = tokenBearer.split(" ")[1];
                // console.log("token", token);
                const query = { patient: patient };
                // const query = {};
                const booking = bookingCollection.find(query);
                const cursor = await booking.toArray();
                return res.send(cursor);
            } else {
                return res.status(403).send({ message: "Forbidden Access" });
            }
        });
        app.get("/service", async (req, res) => {
            const query = {};
            const cursor = servicesCollection.find(query);
            const collection = await cursor.toArray();
            res.send(collection);
        });
        // app.get("/serviceSlot", async (req, res) => {
        //     const query = {};
        //     const cursor = servicesSlotsCollection.find(query);
        //     const collection = await cursor.toArray();
        //     res.send(collection);
        // });

        app.post("/booking", verifyJWT, async (req, res) => {
            const booking = req.body;
            const decodedEmail = req.decoded.email;
            console.log("decoded", booking.patient);
            if (booking.patient === decodedEmail) {
                const query = {
                    treatment: booking.treatment,
                    date: booking.date,
                    patient: booking.patient,
                };
                const exists = await bookingCollection.findOne(query);
                if (exists) {
                    return res.send({ success: false, booking: exists });
                }
                const result = await bookingCollection.insertOne(booking);
                return res.send({ success: true, result });
            } else {
                return res.status(403).send({ message: "Forbidden Access" });
            }
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
