import { NextResponse } from 'next/server';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import path from 'path';

// Define proper TypeScript interfaces for PDF2JSON data structures
interface PDFTextRun {
  T?: string;
}

interface PDFTextItem {
  R?: PDFTextRun[];
}

interface PDFPage {
  Texts?: PDFTextItem[];
}

interface PDFData {
  Pages?: PDFPage[];
}

interface PDFParserError {
  parserError: Error;
}

// Initialize the Google Cloud TTS client
const client = new TextToSpeechClient({
  keyFilename: path.join(process.cwd(), 'gcp-key.json'),
});

export async function POST(req: Request): Promise<Response> {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const generateAudio = formData.get('generateAudio') === 'true';
    const isTextFile = formData.get('isTextFile') === 'true';

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let text = '';

    // Handle text files (from extracted PDF text)
    if (isTextFile) {
      text = buffer.toString('utf-8');
    } else {
      // Handle PDF files
      const PDF2JSON = (await import('pdf2json')).default;
      const pdfParser = new PDF2JSON();

      const result: Response = await new Promise((resolve) => {
        pdfParser.on('pdfParser_dataError', (errData: PDFParserError) => {
          console.error('PDF2JSON Error:', errData);
          resolve(NextResponse.json({ error: 'PDF parsing failed', details: errData }, { status: 400 }));
        });

        pdfParser.on('pdfParser_dataReady', async (pdfData: PDFData) => {
          let extractedText = '';
          pdfData.Pages?.forEach((page: PDFPage) => {
            page.Texts?.forEach((textItem: PDFTextItem) => {
              textItem.R?.forEach((run: PDFTextRun) => {
                if (run.T) {
                  extractedText += decodeURIComponent(run.T) + ' ';
                }
              });
            });
            extractedText += '\n\n';
          });

          extractedText = extractedText.trim();

          if (!extractedText) {
            resolve(NextResponse.json({ error: 'No text found in PDF' }, { status: 400 }));
            return;
          }

          // If not generating audio, just return text
          if (!generateAudio) {
            resolve(NextResponse.json({
              success: true,
              text: extractedText,
              textLength: extractedText.length,
              fileName: file.name,
              method: 'text-extraction-only'
            }));
            return;
          }

          // Generate audio directly
          resolve(await generateAudioResponse(extractedText, file.name));
        });

        pdfParser.parseBuffer(buffer);
      });

      return result;
    }

    // For text files, generate audio if requested
    if (generateAudio && text) {
      return await generateAudioResponse(text, file.name);
    }

    // Return text only for text files when not generating audio
    return NextResponse.json({
      success: true,
      text: text,
      textLength: text.length,
      fileName: file.name,
      method: 'text-extraction-only'
    });

  } catch (error: unknown) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// Helper function to generate audio and return as direct download
async function generateAudioResponse(text: string, fileName: string): Promise<Response> {
  try {
    const chunks = splitTextIntoChunks(text, 4500);
    const audioBuffers: Buffer[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

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

      // Small delay between requests to avoid rate limiting
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    const finalBuffer = Buffer.concat(audioBuffers);
    
    // Generate filename for audio
    const audioFileName = fileName 
      ? fileName.replace(/\.(pdf|txt)$/i, '.mp3')
      : `converted_audio_${Date.now()}.mp3`;

    // Return audio file directly for download
    return new Response(finalBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': `attachment; filename="${audioFileName}"`,
        'Content-Length': finalBuffer.length.toString(),
        'Cache-Control': 'no-cache',
      },
    });

  } catch (ttsError) {
    console.error('Google Cloud TTS Error:', ttsError);
    return NextResponse.json({
      error: 'Audio generation failed',
      details: ttsError instanceof Error ? ttsError.message : 'Unknown TTS error'
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