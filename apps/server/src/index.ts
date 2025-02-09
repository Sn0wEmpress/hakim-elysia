import { Elysia } from "elysia";
import { MongoClient, ObjectId, ServerApiVersion } from "mongodb";
import { cors } from '@elysiajs/cors'

// MongoDB Atlas connection
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri!, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const db = client.db("students");
const students = db.collection("students");

// Create indexes
async function createIndexes() {
    try {
        await students.createIndex({ "student_id": 1 }, { unique: true });
        await students.createIndex({ "firstname": 1 });
        await students.createIndex({ "lastname": 1 });
        await students.createIndex({ "nickname": 1 });
    } catch (error) {
        console.error("Error creating indexes:", error);
    }
}

// Connect to MongoDB
async function connectToMongo() {
    try {
        await client.connect();
        console.log("Connected to MongoDB Atlas");
        await createIndexes();
        // Test the connection
        await db.command({ ping: 1 });
        console.log("Successfully connected to MongoDB Atlas cluster");
    } catch (error) {
        console.error("Error connecting to MongoDB Atlas:", error);
        process.exit(1);
    }
}

// Types
interface Student {
    student_id: string;
    firstname: string;
    lastname: string;
    nickname: string;
}

const app = new Elysia()
    .use(cors())
    // Get all students with pagination
    .get("/students", async ({ query }) => {
        try {
            const page = Number(query?.page) || 1;
            const limit = Number(query?.limit) || 10;
            const skip = (page - 1) * limit;

            const [result, total] = await Promise.all([
                students.find({})
                    .skip(skip)
                    .limit(limit)
                    .toArray(),
                students.countDocuments({})
            ]);

            return {
                students: result,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            if (error instanceof Error) {
                return new Response(
                    JSON.stringify({ message: error.message }),
                    { status: 400 }
                );
            }
            return new Response(
                JSON.stringify({ message: "Can't fetch students." }),
                { status: 500 }
            );
        }
    })
    
    // Create student
    .post("/students", async ({ body }: { body: Student }) => {
        try {
            // Check if student_id already exists
            const existingStudent = await students.findOne({ student_id: body.student_id });
            if (existingStudent) {
                return new Response(
                    JSON.stringify({ message: "Student ID already exists" }),
                    { status: 400 }
                );
            }
            const result = await students.insertOne(body);
            return { ...body, _id: result.insertedId };
        } catch (error) {
            if (error instanceof Error) {
                return new Response(
                    JSON.stringify({ message: error.message }),
                    { status: 400 }
                );
            }
            return new Response(
                JSON.stringify({ message: "Can't create student." }),
                { status: 500 }
            );
        }
    })

    // Get student by id
    .get("/students/:id", async ({ params: { id } }) => {
        try {
            const student = await students.findOne({ _id: new ObjectId(id) });
            if (!student) throw new Error("Can't find this student.");
            return student;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(error.message);
            }
            throw new Error("Can't load student details.");
        }
    })

    // Update student
    .put("/students/:id", async ({ params: { id }, body }: { params: { id: string }, body: Student }) => {
        try {
            // Check if student_id already exists for a different student
            const existingStudent = await students.findOne({ 
                student_id: body.student_id,
                _id: { $ne: new ObjectId(id) }
            });
            if (existingStudent) {
                return new Response(
                    JSON.stringify({ message: "Student ID already exists" }),
                    { status: 400 }
                );
            }
            const result = await students.updateOne(
                { _id: new ObjectId(id) },
                { $set: body }
            );
            if (result.matchedCount === 0) {
                return new Response(
                    JSON.stringify({ message: "Student not found" }),
                    { status: 404 }
                );
            }
            return { ...body, _id: id };
        } catch (error) {
            if (error instanceof Error) {
                return new Response(
                    JSON.stringify({ message: error.message }),
                    { status: 400 }
                );
            }
            return new Response(
                JSON.stringify({ message: "Can't update student." }),
                { status: 500 }
            );
        }
    })

    // Delete student
    .delete("/students/:id", async ({ params: { id } }) => {
        try {
            const result = await students.deleteOne({ _id: new ObjectId(id) });
            if (result.deletedCount === 0) {
                throw new Error("Can't find this student to delete.");
            }
            return { message: "Student deleted successfully" };
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(error.message);
            }
            throw new Error("Can't delete student.");
        }
    })

    // Search students with pagination
    .get("/students/search/:text", async ({ params: { text }, query }) => {
        try {
            const page = Number(query?.page) || 1;
            const limit = Number(query?.limit) || 10;
            const skip = (page - 1) * limit;
    
            const searchText = decodeURIComponent(text);
            const searchQuery = {
                $or: [
                    { student_id: new RegExp(searchText, 'i') },
                    { firstname: new RegExp(searchText, 'i') },
                    { lastname: new RegExp(searchText, 'i') },
                    { nickname: new RegExp(searchText, 'i') }
                ]
            };
    
            const [result, total] = await Promise.all([
                students.find(searchQuery)
                    .collation({ locale: "th", strength: 2 })
                    .skip(skip)
                    .limit(limit)
                    .toArray(),
                students.countDocuments(searchQuery)
            ]);
    
            return {
                students: result,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit) // Ensure totalPages is calculated correctly
                }
            };
        } catch (error) {
            console.error("Search error:", error);
            if (error instanceof Error) {
                return new Response(
                    JSON.stringify({ message: error.message }),
                    { status: 400 }
                );
            }
            return new Response(
                JSON.stringify({ message: "Can't search students." }),
                { status: 500 }
            );
        }
    })
    .listen(3000);

connectToMongo();

console.log(
    `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
