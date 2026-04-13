import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { MongoClient, ServerApiVersion } from "mongodb";

dotenv.config({ path: ".env.local" });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "nychighschoolopportunities";
const collectionName = process.env.MONGODB_COLLECTION || "opportunities";

if (!uri) {
  throw new Error("Missing MONGODB_URI in .env.local");
}

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

function normalizeOpportunity(item: any) {
  const today = new Date().toISOString().slice(0, 10);

  return {
    id: typeof item.id === "number" ? item.id : 0,
    type: item.type || "",
    title: item.title || "",
    location: item.location || "",
    modality: Array.isArray(item.modality) ? item.modality : [],
    applicationDeadline: item.applicationDeadline || "",
    applicationDeadlineLabel: item.applicationDeadlineLabel || "",
    programStartDate: item.programStartDate || "",
    programStartDateLabel: item.programStartDateLabel || "",
    programEndDate: item.programEndDate || "",
    programEndDateLabel: item.programEndDateLabel || "",
    days: Array.isArray(item.days) ? item.days : [],
    grades: Array.isArray(item.grades) ? item.grades : [],
    subjects: Array.isArray(item.subjects) ? item.subjects : [],
    cost: Array.isArray(item.cost) ? item.cost : [],
    image: item.image || "",
    link: item.link || "",
    description: item.description || "",
    createdAt: item.createdAt || today,
    studentLed: Boolean(item.studentLed),
    connectedUsers: Array.isArray(item.connectedUsers)
      ? item.connectedUsers.map((person: any, index: number) => ({
          id:
            typeof person?.id === "string" && person.id.trim()
              ? person.id
              : `${item.id || "opp"}-user-${index}`,
          name: person?.name || "",
          linkedinUrl: person?.linkedinUrl || "",
          image: person?.image || "",
        }))
      : [],
    updatedAt: new Date().toISOString(),
  };
}

async function main() {
  const jsonPath = path.join(__dirname, "..", "data", "opportunities.json");
  const raw = await fs.readFile(jsonPath, "utf8");
  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error("data/opportunities.json must contain an array");
  }

  const docs = parsed
    .map(normalizeOpportunity)
    .filter((item) => item.id && item.title && item.type);

  if (docs.length === 0) {
    throw new Error("No valid opportunities found in JSON");
  }

  try {
    await client.connect();

    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    for (const doc of docs) {
      await collection.updateOne(
        { id: doc.id },
        {
          $set: doc,
        },
        {
          upsert: true,
        }
      );
    }

    console.log(
      `Upserted ${docs.length} opportunities into ${dbName}.${collectionName}`
    );
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});