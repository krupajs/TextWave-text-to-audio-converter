'use client';

import { useRouter } from 'next/navigation';
import { FileText, Upload, ArrowRight, Volume2, Sparkles } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto px-6 py-16 sm:py-24">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-white/20 backdrop-blur-sm rounded-full">
                <Volume2 className="w-12 h-12 text-white" />
              </div>
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold text-white mb-6">
              Text<span className="text-yellow-300">Wave</span>
            </h1>
            <p className="text-xl sm:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Transform your text and PDF documents into high-quality audio 
            </p>
            <div className="flex items-center justify-center space-x-2 text-blue-200">
              <Sparkles className="w-5 h-5" />
              <span className="text-lg">Fast • Accurate • Free</span>
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-16">
        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {/* Text to Audio Card */}
          <div
            onClick={() => router.push('/text_to_audio')}
            className="group relative overflow-hidden bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 group-hover:from-blue-500/10 group-hover:to-purple-500/10 transition-all duration-300"></div>
            <div className="relative p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors">
                  <FileText className="w-8 h-8 text-blue-600" />
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="w-6 h-6 text-blue-600" />
                </div>
              </div>

              <h2 className="text-2xl font-bold text-gray-800 mb-4">Text to Audio</h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Convert any text into natural-sounding speech. Perfect for articles, documents, or any written content you want to listen to.
              </p>

              <div className="space-y-3 mb-8">
                <div className="flex items-center text-sm text-gray-500">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                  Instant conversion
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                  Natural voice synthesis
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                  Copy & paste support
                </div>
              </div>

              <div className="inline-flex items-center justify-center w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                <span>Start Converting Text</span>
                <ArrowRight className="w-5 h-5 ml-2" />
              </div>
            </div>
          </div>

          {/* PDF to Audio Card */}
          <div
            onClick={() => router.push('/pdf_to_audio')}
            className="group relative overflow-hidden bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 group-hover:from-purple-500/10 group-hover:to-pink-500/10 transition-all duration-300"></div>
            <div className="relative p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="p-3 bg-purple-100 rounded-xl group-hover:bg-purple-200 transition-colors">
                  <Upload className="w-8 h-8 text-purple-600" />
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="w-6 h-6 text-purple-600" />
                </div>
              </div>

              <h2 className="text-2xl font-bold text-gray-800 mb-4">PDF to Audio</h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Upload PDF documents and convert them to audio. Great for research papers, ebooks, reports, and any PDF content.
              </p>

              <div className="space-y-3 mb-8">
                <div className="flex items-center text-sm text-gray-500">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                  Drag & drop upload
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                  Text extraction & audio
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                  Download audio files
                </div>
              </div>

              <div className="inline-flex items-center justify-center w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                <span>Start Converting PDF</span>
                <ArrowRight className="w-5 h-5 ml-2" />
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-12 text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-indigo-100 mb-8">Choose your preferred conversion method and transform your content into audio</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push('/text_to_audio')}
              className="px-8 py-4 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors transform hover:scale-105"
            >
              Convert Text Now
            </button>
            <button
              onClick={() => router.push('/pdf_to_audio')}
              className="px-8 py-4 bg-indigo-700 text-white font-semibold rounded-xl hover:bg-indigo-800 transition-colors transform hover:scale-105"
            >
              Upload PDF Now
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-300 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p>&copy; 2025 TextWave. Transform your content into audio effortlessly.</p>
        </div>
      </footer>
    </div>
  );
}
