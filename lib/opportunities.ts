import clientPromise from "@/lib/mongodb";

export type ConnectedUser = {
  id: string;
  name: string;
  linkedinUrl: string;
  image?: string;
};

export type Opportunity = {
  id: string;
  type: string;
  title: string;
  location: string;
  modality: string[];
  applicationDeadline: string;
  applicationDeadlineLabel: string;
  programStartDate: string;
  programStartDateLabel: string;
  programEndDate: string;
  programEndDateLabel: string;
  days: string[];
  grades: string[];
  subjects: string[];
  cost: string[];
  image?: string;
  link?: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
  studentLed?: boolean;
  keywords?: string[];
  connectedUsers: ConnectedUser[];
};

const dbName = process.env.MONGODB_DB || "nychighschoolopportunities";
const collectionName = process.env.MONGODB_COLLECTION || "opportunities";

function mapDocToOpportunity(doc: any): Opportunity {
  return {
    id: String(doc._id),
    type: doc.type || "",
    title: doc.title || "",
    location: doc.location || "",
    modality: Array.isArray(doc.modality) ? doc.modality : [],
    applicationDeadline: doc.applicationDeadline || "",
    applicationDeadlineLabel: doc.applicationDeadlineLabel || "",
    programStartDate: doc.programStartDate || "",
    programStartDateLabel: doc.programStartDateLabel || "",
    programEndDate: doc.programEndDate || "",
    programEndDateLabel: doc.programEndDateLabel || "",
    days: Array.isArray(doc.days) ? doc.days : [],
    grades: Array.isArray(doc.grades) ? doc.grades : [],
    subjects: Array.isArray(doc.subjects) ? doc.subjects : [],
    cost: Array.isArray(doc.cost) ? doc.cost : [],
    image: doc.image || "",
    link: doc.officialListingLink || doc.link || "",
    description: doc.description || "",
    createdAt: doc.createdAt || "",
    updatedAt: doc.updatedAt || "",
    studentLed: Boolean(doc.studentLed),
    keywords: Array.isArray(doc.keywords) ? doc.keywords : [],
    connectedUsers: Array.isArray(doc.peopleToConnectWith)
      ? doc.peopleToConnectWith.map((person: any, index: number) => ({
          id: person?.id || `${doc._id}-person-${index}`,
          name: person?.name || "",
          linkedinUrl: person?.linkedinUrl || "",
          image: person?.image || "",
        }))
      : Array.isArray(doc.connectedUsers)
      ? doc.connectedUsers.map((person: any, index: number) => ({
          id: person?.id || `${doc._id}-person-${index}`,
          name: person?.name || "",
          linkedinUrl: person?.linkedinUrl || "",
          image: person?.image || "",
        }))
      : [],
  };
}

export async function getAllOpportunities(): Promise<Opportunity[]> {
  const client = await clientPromise;
  const db = client.db(dbName);
  const collection = db.collection(collectionName);

  const docs = await collection.find({}).sort({ createdAt: -1, title: 1 }).toArray();

  return docs.map(mapDocToOpportunity);
}