'use client';

interface AudioPlayerProps {
  url: string;
}

export default function AudioPlayer({ url }: AudioPlayerProps) {
  return (
    <div className="mt-4">
      <audio controls src={url} className="w-full" />
      <a
        href={url}
        download
        className="block mt-2 text-blue-600 underline"
      >
        Download Audio
      </a>
    </div>
  );
}
