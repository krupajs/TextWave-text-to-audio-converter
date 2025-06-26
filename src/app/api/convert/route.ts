import { NextResponse } from 'next/server';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';

// Initialize the Google Cloud TTS client
if (!process.env.GCP_CREDENTIALS) {
  throw new Error("Missing GCP_CREDENTIALS environment variable");
}

const client = new TextToSpeechClient({
  credentials: JSON.parse(process.env.GCP_CREDENTIALS),
});

export async function POST(req: Request) {
  const { text } = await req.json();

  if (!text || text.trim().length === 0) {
    return NextResponse.json({ error: 'Text is required' }, { status: 400 });
  }

  try {
    // Split text into chunks if it's too long (Google Cloud TTS has a 5000 character limit)
    const chunks = splitTextIntoChunks(text, 4500);
    const audioBuffers: Buffer[] = [];

    for (const chunk of chunks) {
      // Construct the request for Google Cloud TTS
      const request = {
        input: { text: chunk },
        voice: {
          languageCode: 'en-US',
          name: 'en-US-Standard-D',
          ssmlGender: 'NEUTRAL' as const,
        },
        audioConfig: {
          audioEncoding: 'MP3' as const,
          speakingRate: 1.0,
          pitch: 0.0,
        },
      };

      // Perform the Text-to-Speech request
      const [response] = await client.synthesizeSpeech(request);
      
      if (response.audioContent) {
        audioBuffers.push(Buffer.from(response.audioContent));
      }
    }

    // Concatenate all audio buffers
    const finalBuffer = Buffer.concat(audioBuffers);
    
    // Convert to base64 for client-side playback
    const base64Audio = finalBuffer.toString('base64');
    const audioDataUrl = `data:audio/mp3;base64,${base64Audio}`;

    return NextResponse.json({ 
      audioUrl: audioDataUrl,
      chunksProcessed: chunks.length,
      totalCharacters: text.length,
      audioSize: finalBuffer.length
    });

  } catch (error) {
    console.error('Google Cloud TTS Error:', error);
    return NextResponse.json({ 
      error: 'Text-to-Speech failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Helper function to split text into chunks
function splitTextIntoChunks(text: string, maxChunkSize: number): string[] {
  if (text.length <= maxChunkSize) {
    return [text];
  }

  const chunks: string[] = [];
  const sentences = text.split(/(?<=[.!?])\s+/);
  let currentChunk = '';

  for (const sentence of sentences) {
    if ((currentChunk + ' ' + sentence).length > maxChunkSize && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  // Handle edge case where a single sentence is longer than maxChunkSize
  const finalChunks: string[] = [];
  for (const chunk of chunks) {
    if (chunk.length <= maxChunkSize) {
      finalChunks.push(chunk);
    } else {
      const words = chunk.split(' ');
      let wordChunk = '';
      for (const word of words) {
        if ((wordChunk + ' ' + word).length > maxChunkSize && wordChunk) {
          finalChunks.push(wordChunk.trim());
          wordChunk = word;
        } else {
          wordChunk += (wordChunk ? ' ' : '') + word;
        }
      }
      if (wordChunk.trim()) {
        finalChunks.push(wordChunk.trim());
      }
    }
  }

  return finalChunks;
}