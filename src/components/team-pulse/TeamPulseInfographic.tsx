import { useState } from 'react';
import { Download, ZoomIn, ZoomOut, X, Maximize2 } from 'lucide-react';

interface TeamPulseInfographicProps {
  imageUrl: string | null;
  imageBase64: string | null;
  generatedAt: string;
}

export function TeamPulseInfographic({
  imageUrl,
  imageBase64,
  generatedAt
}: TeamPulseInfographicProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const imageSrc = imageUrl || (imageBase64 ? `data:image/png;base64,${imageBase64}` : null);

  const handleDownload = async () => {
    if (!imageSrc) return;

    try {
      const response = await fetch(imageSrc);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `team-pulse-${new Date(generatedAt).toISOString().split('T')[0]}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download image:', err);
    }
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));

  if (!imageSrc) {
    return (
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 text-center">
        <p className="text-slate-400">No infographic available</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-3 border-b border-slate-700">
          <span className="text-sm text-slate-400">Team Pulse Infographic</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleZoomOut}
              disabled={zoom <= 0.5}
              className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs text-slate-500 min-w-[3rem] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              disabled={zoom >= 3}
              className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-slate-700 mx-1" />
            <button
              onClick={() => setIsFullscreen(true)}
              className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              title="Fullscreen"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleDownload}
              className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="relative bg-slate-900/50">
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 flex items-center justify-center min-h-[300px]">
              <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {imageError && (
            <div className="p-8 text-center min-h-[300px] flex flex-col items-center justify-center">
              <p className="text-red-400">Failed to load infographic</p>
              <p className="text-sm text-slate-500 mt-1">The image may no longer be available</p>
            </div>
          )}
          <div
            className="flex items-center justify-center p-4 overflow-auto transition-transform duration-200"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'center center'
            }}
          >
            <img
              src={imageSrc}
              alt="Team Pulse Infographic"
              className={`rounded-lg shadow-2xl transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              style={{
                width: '100%',
                height: 'auto',
                objectFit: 'contain'
              }}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          </div>
        </div>
      </div>

      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
          <button
            onClick={() => setIsFullscreen(false)}
            className="fixed top-4 right-4 p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-white transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="fixed top-4 left-4 flex items-center gap-2 z-10">
            <button
              onClick={handleZoomOut}
              disabled={zoom <= 0.5}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-white transition-colors disabled:opacity-50"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            <span className="text-white text-sm min-w-[4rem] text-center bg-slate-800/80 px-2 py-1 rounded">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              disabled={zoom >= 3}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-white transition-colors disabled:opacity-50"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
            <button
              onClick={handleDownload}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-white transition-colors ml-2"
            >
              <Download className="w-5 h-5" />
            </button>
          </div>
          <div
            className="p-8 w-full h-full flex items-center justify-center overflow-auto"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
          >
            <img
              src={imageSrc}
              alt="Team Pulse Infographic"
              className="rounded-lg shadow-2xl"
              style={{
                maxWidth: '95vw',
                maxHeight: '90vh',
                width: 'auto',
                height: 'auto',
                objectFit: 'contain'
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
