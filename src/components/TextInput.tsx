'use client';

import { useState } from 'react';

interface TextInputProps {
  onSubmit: (text: string) => void;
  loading: boolean;
}

const MAX_LENGTH = 5000;

const TextInput: React.FC<TextInputProps> = ({ onSubmit, loading }) => {
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (newValue.length <= MAX_LENGTH) {
      setText(newValue);
      setError('');
    } else {
      const allowed = MAX_LENGTH - text.length;
      const pastedText = newValue.slice(text.length, newValue.length);
      const truncated = pastedText.slice(0, allowed);
      const finalText = text + truncated;

      setText(finalText);
      setError(`You pasted more than ${MAX_LENGTH} characters. Only the first ${allowed} characters were accepted.`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim().length === 0) {
      setError('Text cannot be empty.');
      return;
    }
    if (text.length > MAX_LENGTH) {
      setError(`Text exceeds maximum allowed ${MAX_LENGTH} characters.`);
      return;
    }
    setError('');
    onSubmit(text.trim());
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-black">Convert Text to Audio</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="text-input" className="block text-sm font-medium mb-2 text-black">
            Enter your text:
          </label>
          <textarea
            id="text-input"
            value={text}
            onChange={handleChange}
            placeholder="Enter the text you want to convert to audio..."
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
            rows={6}
            required
            disabled={loading}
          />
        </div>

        <div className="flex justify-between items-center">
          <span className={`text-sm ${text.length > MAX_LENGTH ? 'text-red-600' : 'text-gray-600'}`}>
            Characters: {text.length} / {MAX_LENGTH}
          </span>
          <button
            type="submit"
            disabled={!text.trim() || text.length > MAX_LENGTH || loading}
            className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Converting...
              </>
            ) : (
              'Convert to Audio'
            )}
          </button>
        </div>

        {error && (
          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-700 text-sm">
            ⚠️ {error}
          </div>
        )}
      </form>
    </div>
  );
};

export default TextInput;
