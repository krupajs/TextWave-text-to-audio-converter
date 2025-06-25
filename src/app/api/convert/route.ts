import { NextResponse } from 'next/server';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

// Initialize the Google Cloud TTS client
const client = new TextToSpeechClient({
  keyFilename: path.join(process.cwd(), 'gcp-key.json'),
});

export async function POST(req: Request) {
  const { text } = await req.json();

  if (!text || text.trim().length === 0) {
    return NextResponse.json({ error: 'Text is required' }, { status: 400 });
  }

  try {
    // Ensure audio directory exists
    const audioDir = path.join(process.cwd(), 'public', 'audio');
    if (!existsSync(audioDir)) {
      await mkdir(audioDir, { recursive: true });
    }

    // Split text into chunks if it's too long (Google Cloud TTS has a 5000 character limit)
    const chunks = splitTextIntoChunks(text, 4500);
    const audioBuffers: Buffer[] = [];

    for (const chunk of chunks) {
      // Construct the request for Google Cloud TTS
      const request = {
        input: { text: chunk },
        voice: {
          languageCode: 'en-US',
          name: 'en-US-Standard-D', // You can change this to other voices
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

    // If multiple chunks, we need to concatenate them
    // For simplicity, we'll save them as separate files and return the first one
    // In a production app, you might want to use ffmpeg to concatenate audio files
    let finalBuffer: Buffer;
    
    if (audioBuffers.length === 1) {
      finalBuffer = audioBuffers[0];
    } else {
      // For multiple chunks, concatenate the buffers (this is a simple approach)
      // Note: This won't create seamless audio - consider using ffmpeg for better results
      finalBuffer = Buffer.concat(audioBuffers);
    }

    const fileName = `tts_${Date.now()}.mp3`;
    const filePath = path.join(audioDir, fileName);

    await writeFile(filePath, finalBuffer);

    return NextResponse.json({ 
      audioUrl: `/audio/${fileName}`,
      chunksProcessed: chunks.length,
      totalCharacters: text.length
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
    // If adding this sentence would exceed the limit
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
      // Split by words if sentence is too long
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