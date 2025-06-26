'use client';

interface AudioPlayerProps {
  url: string;
}

export default function AudioPlayerPdf({ url }: AudioPlayerProps) {
  return (
    <div className="mt-4">
      <audio controls src={url} className="w-full" />
    </div>
  );
}
