import { relative } from 'node:path';
import { vectorStore } from './prepare.js';
import readline from 'node:readline/promises';
import OpenAI from "openai";

const client = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
});

export async function chat() {

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    })

    while (true) {
        const question = await rl.question('You: ');

        if (question === '/bye') {
            break;
        }

        const relevantChunks = await vectorStore.similaritySearch(question, 3);

        const context = relevantChunks.map(chunk => chunk.pageContent).join('\n\n')
        // console.log(context);

        const systemPrompt = `You are Jarvis, a personal assistant. Your job is to give helpful, accurate, and relevant answers.

                Rules:
                1. Answer ONLY using the information in the CONTEXT section below, which is retrieved from the knowledge base.
                2. If the answer is not in the CONTEXT, reply exactly: "I don't know." Do not guess, and do not use outside knowledge.
                3. Never make up facts, names, dates, numbers, or policies.
                4. Keep answers clear and concise. Use bullet points for steps or lists.
                5. Do not add notes, assumptions, or extra details that are not in the CONTEXT.
                6. Format: start with a short bold title, then bullet points. Do not use italics or emojis.
                7. If only part of the answer is in the CONTEXT, give that part and say "I don't have information on the rest."
                8. For greetings or small talk (like "hi" or "thanks"), reply politely and briefly as Jarvis.`


        const userQuery = `Question: ${question}
        Relavent context" ${context}
        Answer:
        `;

        const completion = await client.chat.completions.create({
            model: 'openai/gpt-oss-20b',
            messages: [
                {
                    role: 'system',
                    content: systemPrompt
                },
                {
                    role: 'user',
                    content: userQuery
                }
            ]
        });

        console.log(`Jarvis: ${completion.choices[0].message.content}`);

    }

    rl.close();

}

chat();