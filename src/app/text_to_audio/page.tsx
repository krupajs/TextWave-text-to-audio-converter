'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';
import TextInput from '@/components/TextInput';
import AudioPlayer from '@/components/AudioPlayer';
import TTSPlayer from '@/components/TTSPlayer';
import { useRouter } from 'next/navigation';
export default function TextToAudioPage() {
  const [textAudioUrl, setTextAudioUrl] = useState<string | null>(null);
  const [textExtractedText, setTextExtractedText] = useState<string | null>(null);
  const [textLoading, setTextLoading] = useState(false);
  const [textErrorMsg, setTextErrorMsg] = useState<string | null>(null);
  const router = useRouter();
  const handleTextSubmit = async (text: string) => {
    setTextLoading(true);
    setTextErrorMsg(null);
    setTextAudioUrl(null);
    setTextExtractedText(null);

    try {
      const response = await fetch('/api/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      const contentType = response.headers.get('content-type');

      if (!response.ok) {
        const errorData = contentType?.includes('application/json')
          ? await response.json()
          : await response.text();
        setTextErrorMsg(errorData?.error || 'Failed to convert text to audio');
        return;
      }

      const data = await response.json();
      if (data.audioUrl) {
        setTextAudioUrl(data.audioUrl);
      } else if (data.text) {
        // Handle client-side TTS
        setTextExtractedText(data.text);
      } else {
        setTextErrorMsg('No audio URL returned');
      }
    } catch (error) {
      console.error('Text to audio failed', error);
      setTextErrorMsg('An error occurred while converting text to audio');
    } finally {
      setTextLoading(false);
    }
  };

  const handleTextReset = () => {
    setTextAudioUrl(null);
    setTextExtractedText(null);
    setTextErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
  <nav className="bg-white border-b shadow-sm">
  <div className="flex items-center justify-between h-16 w-full px-4">
    
    {/* Back to Home - stuck to left */}
    <Link 
      href="/"
      className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
    >
      <ArrowLeft className="w-5 h-5" />
      <span className="hidden sm:inline">Back to Home</span>
    </Link>

    {/* Title Section - aligned with main content */}
    <div className="flex-1">
      <div className="max-w-5xl mx-auto flex items-center space-x-3 pl-4 sm:pl-8">
        <div className="p-2 bg-blue-100 rounded-lg">
          <FileText className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-gray-800 leading-tight">Text to Audio</h1>
          <p className="hidden sm:block text-sm text-gray-600">Convert your text into natural-sounding speech</p>
        </div>
      </div>
    </div>
  </div>
</nav>


      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Text to Audio Section */}
        <section className="bg-white rounded-2xl shadow-xl p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Enter Your Text</h2>
            <p className="text-gray-600">Type or paste the text you want to convert to audio</p>
          </div>
          
          <TextInput onSubmit={handleTextSubmit} loading={textLoading} />
          
          {textErrorMsg && (
            <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <div className="flex items-center">
                <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white text-xs">!</span>
                </div>
                <div>
                  <strong>Error:</strong> {textErrorMsg}
                </div>
              </div>
            </div>
          )}

          {textAudioUrl && (
            <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-blue-800">Audio Generated Successfully!</h3>
                <button
                  onClick={handleTextReset}
                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Convert Another Text
                </button>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <AudioPlayer url={textAudioUrl} />
              </div>
            </div>
          )}

          {textExtractedText && (
            <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-green-800">Text Processed Successfully!</h3>
                <button
                  onClick={handleTextReset}
                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Convert Another Text
                </button>
              </div>
              
              <div className="mb-6 p-4 bg-green-100 border border-green-300 rounded-lg text-green-700">
                <div className="flex items-center mb-2">
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="font-medium">Text processed successfully!</span>
                </div>
                <p className="text-sm">Text length: {textExtractedText.length} characters</p>
                <p className="text-sm">Estimated reading time: ~{Math.ceil(textExtractedText.length / 1000)} minutes</p>
              </div>

              <div className="bg-white p-4 rounded-lg">
                <TTSPlayer text={textExtractedText} />
              </div>
            </div>
          )}
        </section>

        {/* Help Section */}
        <section className="mt-8 bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">How to Use Text to Audio</h2>
          <div className="grid sm:grid-cols-2 gap-6 text-sm text-gray-600">
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800">Step 1: Enter Text</h3>
              <p>Type or paste your text into the text area above. You can enter any amount of text you want to convert.</p>
            </div>
           <div className="space-y-3">
  <h3 className="font-semibold text-gray-800">Step 2: Convert</h3>
  <p>
    Click the &quot;Convert to Audio&quot; button and our AI will generate natural-sounding speech from your text.
  </p>
</div>

            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800">Step 3: Listen</h3>
              <p>Use the audio player to listen to your converted text. You can pause, replay, and control playback speed.</p>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800">Tips</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Use punctuation for natural pauses</li>
                <li>Break long text into paragraphs</li>
                <li>Check spelling for best results</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Other Options */}
           <section className="mt-8 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl p-6 text-white text-center">
      <h2 className="text-xl font-semibold mb-3">Need to Convert a PDF?</h2>
      <p className="text-purple-100 mb-4">Upload PDF documents and convert them to audio automatically</p>
      <button
        onClick={() => router.push('/pdf_to_audio')}
        className="inline-flex items-center px-6 py-3 bg-white text-purple-600 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
      >
        Try PDF to Audio
        <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
      </button>
    </section>
      </main>
    </div>
  );
}