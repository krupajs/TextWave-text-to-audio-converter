import { useState } from 'react';

export const useUpload = () => {
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  return {
    loading,
    setLoading,
    audioUrl,
    setAudioUrl,
  };
};
