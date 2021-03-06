const express = require('express')
const app = express()
const cors = require('cors');
require('dotenv').config();
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// port
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tmyoe.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run(){
  try{
    await client.connect();
    const database = client.db("camera_shop");
    const productCollection = database.collection("products");
    const orderCollection = database.collection("all_orders");
    const userCollection = database.collection("users");
    const reviewCollection = database.collection("reviews");

    app.get('/products', async (req, res) => {
      const cursor = productCollection.find({});
      const products = await cursor.toArray();
      res.json(products)
    })

    app.post('/products', async (req, res) => {
      const product = req.body;
      const result = await productCollection.insertOne(product);
      console.log(result);
      res.json(result)
    })
    app.get('/orders', async (req, res) => {
      const cursor = orderCollection.find({});
      const order = await cursor.toArray();
      res.json(order)
    })
    app.get('/orders/:email', async (req, res) => {
      const email = req.params.email;
      const query = {email: email}
      const cursor = orderCollection.find(query);
      const orders = await cursor.toArray();
      res.json(orders)
    })
    app.post('/orders', async (req, res) => {
      const order = req.body;
      const result = await orderCollection.insertOne(order);
      res.json(result)
    })
    app.put('/orders/:id', async (req, res) => {
      const id = req.params.id;
      console.log(id)
      const filter={_id: ObjectId(id)}
      const updateDoc = {$set: {action:'shiped'}}
      const result = await orderCollection.updateOne(filter,updateDoc);
      res.json(result)
    })
    app.delete('/orders/:id', async (req, res) => {
      const id = req.params.id;
      const query = {_id: ObjectId(id)};
      const result = await orderCollection.deleteOne(query);
      res.json(result)
    })


    app.get('/users/:email', async (req, res) => {
      const email = req.params.email;
      const query = {email: email};
      const user = await userCollection.findOne(query);
      let isAdmin = false;
      if(user?.role === 'admin'){
        isAdmin = true;
      }
      res.json({admin: isAdmin})
    })

    app.post('/users', async (req, res) => {
      const user = req.body;
      const result = await userCollection.insertOne(user);
      res.json(result)
    })
    app.put('/users', async (req, res) => {
      const user = req.body;
      const filter={email:user.email}
      const options={upsert: true}
      const updateDoc = {$set:user}
      const result = await userCollection.updateOne(filter,updateDoc,options);
      res.json(result)
    })
    app.put('/users/admin', async (req, res) => {
      const user = req.body;
      const filter={email: user.email}
      const updateDoc = {$set: {role:'admin'}}
      const result = await userCollection.updateOne(filter,updateDoc);
      res.json(result)
    })
    app.get('/reviews', async (req, res) => {
      const cursor = reviewCollection.find({});
      const reviews = await cursor.toArray();
      res.json(reviews)
    })
    app.post('/reviews', async (req, res) => {
      const user = req.body;
      const result = await reviewCollection.insertOne(user);
      res.json(result)
    })
    
// payment gateway
app.post("/payment", (req, res) => {
  console.log(req.body)
  stripe.charges.create(
    {
      source: req.body.tokenId,
      amount: req.body.amount,
      currency: "usd",
    },
    (stripeErr, stripeRes) => {
      if (stripeErr) {
        res.status(500).json(stripeErr);
      } else {
        res.status(500).json(stripeRes);
      }
    }
  );
});
  }
    
  finally{
    // await client.close();
  }
}

run().catch(console.dir);



app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})