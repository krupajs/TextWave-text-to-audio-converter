import axios from '@/lib/axiosClient';

export const convertTextToAudio = async (text: string) => {
  const response = await axios.post('/api/convert', { text });
  return response.data;
};

export const convertFileToAudio = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post('/api/convert-file', formData);
  return response.data;
};
