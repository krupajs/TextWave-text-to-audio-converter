'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Upload, Download, Volume2, FileText } from 'lucide-react';
import FileUpload from '@/components/FileUpload';
import AudioPlayerPdf from '@/components/AudioPlayerPdf';

export default function PdfToAudioPage() {
  const [pdfAudioUrl, setPdfAudioUrl] = useState<string | null>(null);
  const [pdfExtractedText, setPdfExtractedText] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfErrorMsg, setPdfErrorMsg] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [pdfAudioFileName, setPdfAudioFileName] = useState<string | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [chunksProcessed, setChunksProcessed] = useState<number>(0);

  const handleFileSubmit = async (file: File) => {
    setPdfLoading(true);
    setPdfErrorMsg(null);
    setPdfAudioUrl(null);
    setPdfExtractedText(null);
    setFileName(null);
    setPdfAudioFileName(null);
    setIsGeneratingAudio(false);
    setProcessingStep('Extracting text from PDF...');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('generateAudio', 'false'); // First, just extract text

      const response = await fetch('/api/convert-file', {
        method: 'POST',
        body: formData,
      });

      const contentType = response.headers.get('content-type');

      if (!response.ok) {
        const errorData = contentType?.includes('application/json')
          ? await response.json()
          : await response.text();
        setPdfErrorMsg(errorData?.error || 'Failed to process PDF');
        return;
      }

      const data = await response.json();
      if (data.success && data.text) {
        setPdfExtractedText(data.text);
        setFileName(data.fileName || file.name);
        setProcessingStep('');
      } else {
        setPdfErrorMsg('No content extracted from PDF');
      }
    } catch (error) {
      console.error('PDF processing failed', error);
      setPdfErrorMsg('An error occurred while processing PDF');
    } finally {
      setPdfLoading(false);
      setProcessingStep('');
    }
  };

  const handlePdfReset = () => {
    setPdfAudioUrl(null);
    setPdfExtractedText(null);
    setPdfErrorMsg(null);
    setFileName(null);
    setPdfAudioFileName(null);
    setIsGeneratingAudio(false);
    setProcessingStep('');
    setChunksProcessed(0);
  };

  const handleGenerateAudio = async () => {
    if (!pdfExtractedText) return;
    
    setIsGeneratingAudio(true);
    setPdfErrorMsg(null);
    setProcessingStep('Generating audio with Google Cloud TTS...');

    try {
      const response = await fetch('/api/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: pdfExtractedText }),
      });

      const contentType = response.headers.get('content-type');

      if (!response.ok) {
        const errorData = contentType?.includes('application/json')
          ? await response.json()
          : await response.text();
        setPdfErrorMsg(errorData?.error || 'Failed to generate audio from PDF text');
        return;
      }

      const data = await response.json();
      if (data.audioUrl) {
        setPdfAudioUrl(data.audioUrl);
        setChunksProcessed(data.chunksProcessed || 1);
        // Create audio filename based on PDF name
        const audioFileName = fileName 
          ? fileName.replace(/\.pdf$/i, '.mp3')
          : 'converted-audio.mp3';
        setPdfAudioFileName(audioFileName);
        setProcessingStep('');
      } else {
        setPdfErrorMsg('No audio URL returned from server');
      }
    } catch (error) {
      console.error('Audio generation failed', error);
      setPdfErrorMsg('An error occurred while generating audio');
    } finally {
      setIsGeneratingAudio(false);
      setProcessingStep('');
    }
  };

  const handleDownloadAudio = async () => {
    if (!pdfAudioUrl || !pdfAudioFileName) return;

    try {
      const response = await fetch(pdfAudioUrl);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = pdfAudioFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed', error);
      setPdfErrorMsg('Failed to download audio file');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
<nav className="bg-white border-b shadow-sm">
  <div className="flex items-center justify-between h-16 w-full px-4">
    
    {/* Left-aligned Back Button - sticks to left edge */}
    <Link 
      href="/"
      className="flex items-center space-x-2 text-gray-600 hover:text-purple-600 transition-colors"
    >
      <ArrowLeft className="w-5 h-5" />
      <span className="hidden sm:inline">Back to Home</span>
    </Link>

    {/* Center Section (aligned with main content) */}
    <div className="flex-1">
      <div className="max-w-5xl mx-auto flex items-center space-x-3 pl-4 sm:pl-8">
        <div className="p-2 bg-purple-100 rounded-lg">
          <Upload className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-gray-800 leading-tight">PDF to Audio</h1>
          <p className="hidden sm:block text-sm text-gray-600">Upload PDF documents and convert them to high-quality audio</p>
        </div>
      </div>
    </div>
  </div>
</nav>



      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* PDF Upload Section */}
        <section className="bg-white rounded-2xl shadow-xl p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Upload Your PDF</h2>
            <p className="text-gray-600">Select a PDF file to extract text and convert to professional audio using Google Cloud TTS</p>
          </div>
          
          <FileUpload onSubmit={handleFileSubmit} loading={pdfLoading} />

          {/* Processing Status */}
          {processingStep && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
                <span className="text-blue-700 font-medium">{processingStep}</span>
              </div>
            </div>
          )}
          
          {pdfErrorMsg && (
            <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <div className="flex items-center">
                <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white text-xs">!</span>
                </div>
                <div>
                  <strong>Error:</strong> {pdfErrorMsg}
                </div>
              </div>
            </div>
          )}

          {pdfAudioUrl && (
            <div className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-purple-800">PDF Audio Generated Successfully!</h3>
                  {fileName && <p className="text-sm text-purple-600">From: {fileName}</p>}
                  {chunksProcessed > 1 && (
                    <p className="text-xs text-purple-500">Processed in {chunksProcessed} audio segments</p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleDownloadAudio}
                    className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </button>
                  <button
                    onClick={handlePdfReset}
                    className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    Upload Another PDF
                  </button>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <AudioPlayerPdf url={pdfAudioUrl} />
              </div>
            </div>
          )}

          {pdfExtractedText && !pdfAudioUrl && (
            <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-green-800">Text Extracted Successfully!</h3>
                  {fileName && <p className="text-sm text-green-600">From: {fileName}</p>}
                  <p className="text-xs text-green-500">{pdfExtractedText.length} characters extracted</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleGenerateAudio}
                    disabled={isGeneratingAudio}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors"
                  >
                    {isGeneratingAudio ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-4 h-4" />
                        <span>Generate Audio</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={handlePdfReset}
                    className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    Upload Another PDF
                  </button>
                </div>
              </div>
              
              {/* Text Preview */}
              <div className="bg-white p-4 rounded-lg border border-green-200">
                <div className="mb-3">
                  <h4 className="text-sm font-medium text-gray-700">Text Preview</h4>
                  <p className="text-xs text-gray-500">
                    {pdfExtractedText.length} characters • Estimated reading time: ~{Math.ceil(pdfExtractedText.length / 1000)} minutes
                  </p>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {pdfExtractedText.length > 1000 
                      ? `${pdfExtractedText.substring(0, 1000)}...` 
                      : pdfExtractedText
                    }
                  </p>
                  {pdfExtractedText.length > 1000 && (
                    <button 
                      onClick={() => {
                        const element = document.createElement('div');
                        element.innerHTML = `<pre style="white-space: pre-wrap; font-family: inherit;">${pdfExtractedText}</pre>`;
                        const newWindow = window.open('', '_blank');
                        if (newWindow) {
                          newWindow.document.body.appendChild(element);
                          newWindow.document.title = `Full Text - ${fileName}`;
                        }
                      }}
                      className="mt-2 text-xs text-green-600 hover:text-green-700 underline"
                    >
                      View full text
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Instructions Section */}
        <section className="mt-8 bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">How it works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Upload className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-medium text-gray-800 mb-2">1. Upload PDF</h3>
              <p className="text-sm text-gray-600">Select and upload your PDF document for text extraction</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-medium text-gray-800 mb-2">2. Review Text</h3>
              <p className="text-sm text-gray-600">Preview extracted text and confirm quality before conversion</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Volume2 className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-medium text-gray-800 mb-2">3. Generate Audio</h3>
              <p className="text-sm text-gray-600">Convert to high-quality audio using Google Cloud TTS</p>
            </div>
          </div>
{/* 
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">✨ Powered by Google Cloud Text-to-Speech</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• High-quality, natural-sounding voice synthesis</li>
              <li>• Handles documents of any length</li>
              <li>• Professional audio output suitable for any use</li>
              <li>• Automatic text chunking for optimal processing</li>
            </ul>
          </div> */}
        </section>
      </main>
    </div>
  );
}