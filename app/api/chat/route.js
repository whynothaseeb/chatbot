import { NextResponse } from 'next/server'; // Import NextResponse from Next.js for handling responses
import OpenAI from 'openai'; // Import OpenAI library for interacting with the OpenAI API

// System prompt for the AI, providing guidelines on how to respond to users
const systemPrompt = 'You are a chatbot for everyday conversations. Be polite and brief. Do not ask if the user needs support unless they explicitly state that they need help.'; // Use your own system prompt here

// POST function to handle incoming requests
export async function POST(req) {
  const openai = new OpenAI({
    apiKey: process.env.NEXT_PUBLIC_OPENROUTER_API_KEY, // Use the OpenRouter API key
    baseURL: 'https://openrouter.ai/api/v1', // Set OpenRouter's base URL
  });

  const data = await req.json(); // Parse the JSON body of the incoming request

  // Create a chat completion request to the OpenRouter API with the specified model
  const completion = await openai.chat.completions.create({
    messages: [{ role: 'system', content: systemPrompt }, ...data], // Include the system prompt and user messages
    model: 'meta-llama/llama-3.1-8b-instruct:free', // Specify the OpenRouter model to use
    stream: true, // Enable streaming responses
  });

  // Create a ReadableStream to handle the streaming response
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder(); // Create a TextEncoder to convert strings to Uint8Array
      try {
        // Iterate over the streamed chunks of the response
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content; // Extract the content from the chunk
          if (content) {
            const text = encoder.encode(content); // Encode the content to Uint8Array
            controller.enqueue(text); // Enqueue the encoded text to the stream
          }
        }
      } catch (err) {
        controller.error(err); // Handle any errors that occur during streaming
      } finally {
        controller.close(); // Close the stream when done
      }
    },
  });

  return new NextResponse(stream); // Return the stream as the response
}
