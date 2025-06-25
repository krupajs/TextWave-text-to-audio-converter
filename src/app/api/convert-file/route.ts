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
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const generateAudio = formData.get('generateAudio') === 'true';

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log('Processing PDF with PDF2JSON...');

    const PDF2JSON = require('pdf2json');
    const pdfParser = new PDF2JSON();

    return new Promise((resolve) => {
      pdfParser.on('pdfParser_dataError', (errData: any) => {
        console.error('PDF2JSON Error:', errData);
        resolve(NextResponse.json({ error: 'PDF parsing failed', details: errData }, { status: 400 }));
      });

      pdfParser.on('pdfParser_dataReady', async (pdfData: any) => {
        console.log('PDF2JSON Success! Pages:', pdfData.Pages?.length || 0);

        let text = '';
        pdfData.Pages?.forEach((page: any) => {
          page.Texts?.forEach((textItem: any) => {
            textItem.R?.forEach((run: any) => {
              if (run.T) {
                text += decodeURIComponent(run.T) + ' ';
              }
            });
          });
          // Add page break
          text += '\n\n';
        });

        text = text.trim();
        console.log('Extracted text length:', text.length);

        if (!text) {
          resolve(NextResponse.json({ error: 'No text found in PDF' }, { status: 400 }));
          return;
        }

        // If generateAudio is requested, create audio using Google Cloud TTS
        if (generateAudio) {
          try {
            // Ensure audio directory exists
            const audioDir = path.join(process.cwd(), 'public', 'audio');
            if (!existsSync(audioDir)) {
              await mkdir(audioDir, { recursive: true });
            }

            // Split text into chunks for Google Cloud TTS (5000 character limit)
            const chunks = splitTextIntoChunks(text, 4500);
            const audioBuffers: Buffer[] = [];

            console.log(`Processing ${chunks.length} text chunks for TTS...`);

            for (let i = 0; i < chunks.length; i++) {
              const chunk = chunks[i];
              console.log(`Processing chunk ${i + 1}/${chunks.length} (${chunk.length} characters)`);

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

              // Add a small delay to avoid rate limiting
              if (i < chunks.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 100));
              }
            }

            // Concatenate audio buffers
            const finalBuffer = Buffer.concat(audioBuffers);
            const audioFileName = `pdf_${Date.now()}.mp3`;
            const audioFilePath = path.join(audioDir, audioFileName);

            await writeFile(audioFilePath, finalBuffer);

            resolve(NextResponse.json({
              success: true,
              audioUrl: `/audio/${audioFileName}`,
              text: text,
              textLength: text.length,
              fileName: file.name,
              chunksProcessed: chunks.length,
              method: 'google-cloud-tts'
            }));

          } catch (ttsError) {
            console.error('Google Cloud TTS Error:', ttsError);
            // Fallback to returning text only
            resolve(NextResponse.json({
              success: true,
              text: text,
              textLength: text.length,
              fileName: file.name,
              error: 'Audio generation failed, but text extraction succeeded',
              method: 'text-only'
            }));
          }
        } else {
          // Return text only for client-side processing or preview
          resolve(NextResponse.json({
            success: true,
            text: text,
            textLength: text.length,
            fileName: file.name,
            method: 'text-extraction-only'
          }));
        }
      });

      pdfParser.parseBuffer(buffer);
    });

  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Helper function to split text into chunks (same as in convert route)
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