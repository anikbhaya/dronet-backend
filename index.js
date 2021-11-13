const express = require('express')
const cors = require('cors')
const { MongoClient } = require('mongodb');
const admin = require("firebase-admin")
const ObjectId = require('mongodb').ObjectId


const app = express()
const port = process.env.PORT || 5000;

const serviceAccount = './drone-website-1248a-firebase-admin.json'
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})

app.use(cors())
require('dotenv').config();
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.7ojlu.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


const verifyToken = async (req, res, next) => {
  if (req?.headers?.authorization?.startsWith('Bearar ')) {
    const idToken = req?.headers?.authorization.split('Bearar ')[1]

    try {
      const decodedUser = await admin.auth().verifyIdToken(idToken)
      req.decodedUserEmail = decodedUser.email
    }
    catch {

    }
  }
  next()
}

async function run() {
  try {
    await client.connect()
    const database = client.db('dronet')
    const productsCollection = database.collection('products')
    const reviewsCollection = database.collection('reviews')
    const ordersCollection = database.collection('orders')
    const userRolesCollection = database.collection('userRoles')

    // Get All Products Details
    app.get('/products', async (req, res) => {

      const quantity = await req?.query?.quantity
          if (quantity) {
            const allProducts = await productsCollection.find({}).limit(parseInt(quantity)).toArray()
            res.send(allProducts)
          } else {
            const allProducts = await productsCollection.find({}).toArray()
            res.send(allProducts)
          }



    })

    app.get('/reviews', async (req, res) => {
      const allReviews = await reviewsCollection.find({}).toArray()
      res.send(allReviews)
    })

    app.get('/placeOrder', verifyToken, async (req, res) => {
      if (req.query?.email) {
        if (req.query.email === req.decodedUserEmail) {
          const id = req.query.id
          const product = await productsCollection.find({ _id: ObjectId(id) }).toArray()

          res.send(product[0])
        } else {
          res.status(401).json({ 'message': 'Unauthorized Access' })
        }
      } else {
        res.status(401).json({ 'message': 'Unauthorized Access' })
      }

    })

    app.post('/submitOrder', async (req, res) => {
      const orderInfo = req.body
      const submitOrder = await ordersCollection.insertOne(orderInfo)


      res.send()
    })

    // Get All Products Details
    app.get('/', async (req, res) => {
      res.send("Server running")
    })

    // Get Single User Order List
    app.post('/singleUserOrders', async (req, res) => {
      const userEmail = await req.body.userEmail
      const singleUserOrdersList = await ordersCollection.find({ userEmail: userEmail }).toArray();

      res.json(singleUserOrdersList)
    })

    // Get Single User Order List
    app.post('/getAllOrders', async (req, res) => {
      const singleUserOrdersList = await ordersCollection.find({}).toArray();

      res.json(singleUserOrdersList)
    })


    // Delete Order
    app.post('/deleteOrder', async (req, res) => {
      const deleteReqId = await req.body.deleteReqId
      await ordersCollection.deleteOne({ _id: ObjectId(deleteReqId) })

      res.send()
    })

    // Submit Order
    app.post('/submitReview', async (req, res) => {
      const data = req.body
      await reviewsCollection.insertOne(data)

      res.send()
    })


    app.post('/updateStatus', async (req, res) => {
      const status = req.body.status
      const id = req.body.id
      const filter = { _id: ObjectId(id) };
      await ordersCollection.updateOne(filter, { $set: { status: status } });

      res.send()
    })


    app.post('/AddNewProduct', async (req, res) => {
      const data = req.body
      await productsCollection.insertOne(data)

      res.send()
    })


    app.post('/makeAdmin', async (req, res) => {
      const email = req.body.email

      const filter = { userEmail: email }
      const options = { upsert: true }
      const updateRoles = {
        $set: {
          isAdmin: true
        }
      }
      await userRolesCollection.updateOne(filter, updateRoles, options)


      res.send()
    })

    app.get('/isAdmin', async (req, res) => {
      const userEmail = req.query.userEmail
      const result = await userRolesCollection.find({ userEmail: userEmail }).toArray()

      res.send(result[0])
    })

    app.get('/getProducts', async (req, res) => {
      const products = await productsCollection.find({}).toArray()

      res.send(products)
    })

    // Delete Products
    app.post('/deleteProducts', async (req, res) => {
      const deleteReqId = await req.body.deleteReqId
      await productsCollection.deleteOne({ _id: ObjectId(deleteReqId) })

      res.send()
    })









  } finally {

  }
}

run().catch(console.dir)



app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})