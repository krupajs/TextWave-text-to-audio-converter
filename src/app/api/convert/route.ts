import { NextResponse } from 'next/server';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';

if (!process.env.GCP_CREDENTIALS) {
  throw new Error('Missing GCP_CREDENTIALS environment variable');
}

const client = new TextToSpeechClient({
  credentials: JSON.parse(process.env.GCP_CREDENTIALS),
});

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const chunks = splitTextIntoChunks(text, 4500);
    const audioBuffers: Buffer[] = [];

    for (const chunk of chunks) {
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

      const [response] = await client.synthesizeSpeech(request);

      if (response.audioContent) {
        audioBuffers.push(Buffer.from(response.audioContent));
      }
    }

    const finalBuffer = Buffer.concat(audioBuffers);

    if (!finalBuffer || finalBuffer.length === 0) {
      return NextResponse.json({ error: 'Generated audio is empty' }, { status: 500 });
    }

    return new Response(finalBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': `inline; filename="tts_audio.mp3"`,
        'Content-Length': finalBuffer.length.toString(),
        'Cache-Control': 'no-store',
      },
    });

  } catch (error) {
    console.error('TTS Error:', error);
    return NextResponse.json({
      error: 'Text-to-Speech failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Split text into chunks
function splitTextIntoChunks(text: string, maxChunkSize: number): string[] {
  if (text.length <= maxChunkSize) return [text];

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

  if (currentChunk.trim()) chunks.push(currentChunk.trim());

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
