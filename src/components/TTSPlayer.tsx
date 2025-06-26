'use client';

import React, { useState, useRef, useEffect } from 'react';

interface TTSPlayerProps {
  text: string;
}

const TTSPlayer: React.FC<TTSPlayerProps> = ({ text }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [_, setCurrentPosition] = useState(0);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<number>(0);
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [volume, setVolume] = useState(1);
  const [showText, setShowText] = useState(false);
  
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const chunksRef = useRef<string[]>([]);
  const currentChunkRef = useRef(0);
  const totalChunksRef = useRef(0);

  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = speechSynthesis.getVoices();
      setVoices(availableVoices);
      
      // Try to select a good default voice (English)
      const englishVoice = availableVoices.findIndex(
        voice => voice.lang.startsWith('en') && voice.localService
      );
      if (englishVoice !== -1) {
        setSelectedVoice(englishVoice);
      }
    };

    loadVoices();
    speechSynthesis.addEventListener('voiceschanged', loadVoices);

    return () => {
      speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      speechSynthesis.cancel();
    };
  }, []);

  // Split text into chunks for better handling of long texts
  const splitTextIntoChunks = (text: string, maxLength: number = 200): string[] => {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    const chunks: string[] = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      const potentialChunk = currentChunk + sentence + '. ';
      if (potentialChunk.length > maxLength && currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence + '. ';
      } else {
        currentChunk = potentialChunk;
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks.length > 0 ? chunks : [text];
  };

  const speakChunk = (chunkIndex: number) => {
    if (chunkIndex >= chunksRef.current.length) {
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentPosition(0);
      currentChunkRef.current = 0;
      return;
    }

    const utterance = new SpeechSynthesisUtterance(chunksRef.current[chunkIndex]);
    
    if (voices[selectedVoice]) {
      utterance.voice = voices[selectedVoice];
    }
    
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      currentChunkRef.current++;
      if (currentChunkRef.current < chunksRef.current.length) {
        speakChunk(currentChunkRef.current);
      } else {
        setIsPlaying(false);
        setIsPaused(false);
        setCurrentPosition(0);
        currentChunkRef.current = 0;
      }
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsPlaying(false);
      setIsPaused(false);
    };

    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        setCurrentPosition(event.charIndex);
      }
    };

    utteranceRef.current = utterance;
    speechSynthesis.speak(utterance);
  };

  const startSpeaking = () => {
    if (isPaused) {
      speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
    } else {
      chunksRef.current = splitTextIntoChunks(text);
      totalChunksRef.current = chunksRef.current.length;
      currentChunkRef.current = 0;
      setCurrentPosition(0);
      speakChunk(0);
    }
  };

  const pauseSpeaking = () => {
    if (speechSynthesis.speaking && !speechSynthesis.paused) {
      speechSynthesis.pause();
      setIsPaused(true);
      setIsPlaying(false);
    }
  };

  const stopSpeaking = () => {
    speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentPosition(0);
    currentChunkRef.current = 0;
  };

  const getProgressPercentage = () => {
    if (totalChunksRef.current === 0) return 0;
    return ((currentChunkRef.current) / totalChunksRef.current) * 100;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const estimatedTotalTime = Math.ceil(text.length / (rate * 180)); // Rough estimate: 180 chars per minute at 1x speed

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold mb-4 flex items-center text-black">
          <span className="mr-2">🎧</span>
          Text-to-Speech Player
        </h3>
        
        {/* Voice Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2 text-black">Select Voice:</label>
          <select 
            value={selectedVoice} 
            onChange={(e) => setSelectedVoice(parseInt(e.target.value))}
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 text-black"
            disabled={isPlaying}
          >
            {voices.map((voice, index) => (
              <option key={index} value={index}>
                {voice.name} ({voice.lang}) {voice.localService ? '(Local)' : '(Remote)'}
              </option>
            ))}
          </select>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-black">Speed:</label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={rate}
              onChange={(e) => setRate(parseFloat(e.target.value))}
              className="w-full"
              disabled={isPlaying}
            />
            <span className="text-sm text-gray-600">{rate}x</span>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-black">Pitch:</label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={pitch}
              onChange={(e) => setPitch(parseFloat(e.target.value))}
              className="w-full"
              disabled={isPlaying}
            />
            <span className="text-sm text-gray-600">{pitch}</span>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-black">Volume:</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full"
            />
            <span className="text-sm text-gray-600">{Math.round(volume * 100)}%</span>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={startSpeaking}
            disabled={isPlaying}
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPaused ? (
              <>▶️ Resume</>
            ) : (
              <>▶️ Play</>
            )}
          </button>
          
          <button
            onClick={pauseSpeaking}
            disabled={!isPlaying}
            className="flex items-center px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ⏸️ Pause
          </button>
          
          <button
            onClick={stopSpeaking}
            disabled={!isPlaying && !isPaused}
            className="flex items-center px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ⏹️ Stop
          </button>

          <button
            onClick={() => setShowText(!showText)}
            className="flex items-center px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
          >
            {showText ? '📖 Hide Text' : '📖 Show Text'}
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>
              Progress: {currentChunkRef.current + (isPlaying || isPaused ? 1 : 0)} of {totalChunksRef.current} sections
            </span>
            <span>
              Est. time: ~{formatTime(estimatedTotalTime * 60)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-blue-600 h-3 rounded-full transition-all duration-300 flex items-center justify-end pr-2" 
              style={{ width: `${getProgressPercentage()}%` }}
            >
              {getProgressPercentage() > 10 && (
                <span className="text-xs text-white font-bold">
                  {Math.round(getProgressPercentage())}%
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="text-sm text-gray-600 mb-4">
          {isPlaying && <span className="text-green-600">▶️ Playing...</span>}
          {isPaused && <span className="text-yellow-600">⏸️ Paused</span>}
          {!isPlaying && !isPaused && <span className="text-gray-500">⏹️ Ready to play</span>}
        </div>

        {/* Text Display */}
        {showText && (
          <div className="border rounded-lg p-4 max-h-96 overflow-y-auto bg-gray-50 text-black">
            <h4 className="font-semibold mb-2">Document Content:</h4>
            <div className="text-sm leading-relaxed whitespace-pre-wrap">
              {text}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TTSPlayer;