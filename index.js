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

        const servicesCollection = client
            .db("servicesCollection")
            .collection("services");
        const bookingCollection = client
            .db("bookingCollection")
            .collection("booking");

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
        app.get("/dashboard", async (req, res) => {
            const patient = req.query.treatment;
            console.log(patient);
            const query = { patient: patient };
            // const query = {};
            const booking = bookingCollection.find(query);
            const cursor = await booking.toArray();
            res.send(cursor);
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

        app.post("/booking", async (req, res) => {
            const booking = req.body;
            console.log(booking);
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
            res.send({ success: true, result });
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
