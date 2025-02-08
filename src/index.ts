import { Elysia } from "elysia";
import { MongoClient, ObjectId, ServerApiVersion } from "mongodb";

// MongoDB Atlas connection
const uri = "mongodb+srv://plumkungzaza:C6OmzXYqoG2sxLdB@cluster0.iwrah.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const db = client.db("ecommerce");
const products = db.collection("product");

// Connect to MongoDB
async function connectToMongo() {
    try {
        await client.connect();
        console.log("Connected to MongoDB Atlas");
        
        // Test the connection
        await db.command({ ping: 1 });
        console.log("Successfully connected to MongoDB Atlas cluster");
    } catch (error) {
        console.error("Error connecting to MongoDB Atlas:", error);
        process.exit(1);
    }
}

// Types
interface Top {
    name: string;
}

interface Product {
    name: string;
    price: number;
    top: Top[];
}

const app = new Elysia()
    // Get all products
    .get("/products", async () => {
        try {
            const products_list = await products.find({}).toArray();
            return products_list;
        } catch (error) {
            throw new Error("Can't load products list.");
        }
    })
    
    // Create product
    .post("/products", async ({ body }) => {
        try {
            const product = body as Product;
            const result = await products.insertOne(product);
            return { id: result.insertedId, ...product };
        } catch (error) {
            throw new Error("Can't create product.");
        }
    })

    // Get product by id
    .get("/products/:id", async ({ params: { id } }) => {
        try {
            const product = await products.findOne({ _id: new ObjectId(id) });
            if (!product) throw new Error("Can't find this product.");
            return product;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(error.message);
            }
            throw new Error("Can't load product details.");
        }
    })

    // Update product
    .put("/products/:id", async ({ params: { id }, body }) => {
        try {
            const product = body as Product;
            const result = await products.updateOne(
                { _id: new ObjectId(id) },
                { $set: product }
            );
            if (result.matchedCount === 0) {
                throw new Error("Can't find this product to update.");
            }
            return { id, ...product };
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(error.message);
            }
            throw new Error("Can't update product.");
        }
    })

    // Delete product
    .delete("/products/:id", async ({ params: { id } }) => {
        try {
            const result = await products.deleteOne({ _id: new ObjectId(id) });
            if (result.deletedCount === 0) {
                throw new Error("Can't find this product to delete.");
            }
            return { message: "Product deleted successfully" };
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(error.message);
            }
            throw new Error("Can't delete product.");
        }
    })

    // Get products with price
    .get("/products/price/:price", async ({ params: { price } }) => {
        try {
            // const result = await products.find({ price: { $gt: parseInt(price) } }).toArray(); // $gt = greater than, $lt = less than
            const result = await products.find({ price: parseInt(price) }).toArray();
            return result;                                                                  
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(error.message);
            }
            throw new Error("Can't get products.");
        }
    })

    // Get products with topping
    .get("/products/topping/:topping", async ({ params: { topping } }) => {
        try {
            // const result = await products.find({ "top": { $in: [ { name: topping } ] } }).toArray(); // .../products/topping/dark [only one topping]
            const result = await products.find({ "top.name": { $in: topping.split(",") } }).toArray(); // .../products/topping/dark,white [can search multiple toppings]
            return result;                                                                  
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(error.message);
            }
            throw new Error("Can't get products.");
        }
    })

    .listen(3000);

connectToMongo();

console.log(
    `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
