export interface ConvertResponse {
  audioUrl: string;
}

export interface TextInputProps {
  onConvert: (text: string) => void;
}

export interface FileUploadProps {
  onConvert: (file: File) => void;
}
