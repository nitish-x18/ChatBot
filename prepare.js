import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { Pinecone } from "@pinecone-database/pinecone";
import { PineconeStore } from "@langchain/pinecone";
// import { Metadata } from "pdf-parse";

const embeddings = new GoogleGenerativeAIEmbeddings({
  model: "gemini-embedding-001",
});

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

const indexName = "rbu-chatbot-index";
const index = pinecone.Index(indexName);

const vectorStore = await PineconeStore.fromExistingIndex(
  embeddings,
  { pineconeIndex: index }
);

export async function indexTheDocument(filePath) {

    const loader = new PDFLoader(filePath, { splitPages: false });
    const doc = await loader.load();

    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 500,
        chunkOverlap: 100
    });

    const texts = await splitter.splitText(doc[0].pageContent);

    const documents = texts.map((chunk) => {
        return {
            pageContent: chunk,
            Metadata: doc[0].metadata
        }
    })

    await vectorStore.addDocuments(documents);

    console.log(documents);

}