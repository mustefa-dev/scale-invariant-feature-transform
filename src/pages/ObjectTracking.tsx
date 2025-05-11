import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, Play, Clock, Video, Gauge } from "lucide-react";
import ProgressBar from "@/components/ui/ProgressBar";

const ObjectTracking = () => {
  const navigate = useNavigate();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{
    video_filename: string;
    thumbnail_filename: string;
  } | null>(null);
  const [videoMetadata, setVideoMetadata] = useState<{
    duration: string;
    dimensions: string;
  } | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const handleFileChange = async (file: File) => {
    setVideoFile(file);
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    
    video.onloadedmetadata = () => {
      setVideoMetadata({
        duration: `${Math.round(video.duration)}s`,
        dimensions: `${video.videoWidth}x${video.videoHeight}`
      });
      URL.revokeObjectURL(url);
    };
    
    video.src = url;
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!videoFile) return;

    setIsProcessing(true);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => Math.min(prev + (Math.random() * 10), 90));
    }, 500);

    try {
      const formData = new FormData();
      formData.append("video", videoFile);

      const response = await fetch("http://localhost:5000/api/track-object", {
        method: "POST",
        body: formData,
      });

      clearInterval(interval);
      setProgress(100);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Processing failed");
      }

      const data = await response.json();
      setResult(data);
      toast.success("Tracking completed successfully!");
    } catch (error) {
      console.error("Error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to process video");
    } finally {
      setIsProcessing(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Button
        variant="outline"
        onClick={() => navigate("/")}
        className="mb-6 gap-1"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </Button>

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Object Tracking Analysis
        </h1>
        <p className="text-gray-600 mt-2">
          Track objects using feature matching with real-time processing
        </p>
      </div>

      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="w-6 h-6" />
            Video Tracking Analysis
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div
            className={`relative border-2 border-dashed rounded-xl p-8 transition-all ${
              dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-50"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center justify-center gap-4">
              <Upload className="w-12 h-12 text-gray-400" />
              <div className="text-center">
                <p className="font-medium text-gray-900">
                  Drag & drop video file or{" "}
                  <label
                    htmlFor="video-upload"
                    className="text-blue-600 cursor-pointer hover:underline"
                  >
                    browse files
                  </label>
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Supported formats: MP4, AVI, MOV (Max 100MB)
                </p>
              </div>
              <input
                id="video-upload"
                type="file"
                className="hidden"
                accept="video/*"
                onChange={e => e.target.files?.[0] && handleFileChange(e.target.files[0])}
              />
            </div>
          </div>

          {videoFile && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Video className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium">{videoFile.name}</p>
                    {videoMetadata && (
                      <div className="flex gap-4 mt-1">
                        <span className="flex items-center gap-1 text-sm text-gray-500">
                          <Clock className="w-4 h-4" />
                          {videoMetadata.duration}
                        </span>
                        <span className="flex items-center gap-1 text-sm text-gray-500">
                          <Gauge className="w-4 h-4" />
                          {videoMetadata.dimensions}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setVideoFile(null)}
                >
                  Remove
                </Button>
              </div>

              <video
                ref={videoRef}
                src={URL.createObjectURL(videoFile)}
                controls
                className="w-full rounded-lg border"
              />
            </div>
          )}

          {isProcessing && (
            <div className="space-y-2">
              <ProgressBar value={progress} />
              <p className="text-sm text-gray-500 text-center">
                {progress < 90 ? "Processing video..." : "Finalizing results..."}
              </p>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Tracking Results</h3>
              <div className="bg-black rounded-lg overflow-hidden border">
                <video
                  controls
                  className="w-full"
                  src={`http://localhost:5000/static/results/${result.video_filename}`}
                  poster={`http://localhost:5000/static/results/${result.thumbnail_filename}`}
                />
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium">Processing Summary</p>
                  <ul className="mt-2 space-y-1 text-gray-600">
                    <li>• Object tracked using feature matching</li>
                    <li>• HD resolution output</li>
                    <li>• Frame-by-frame analysis</li>
                  </ul>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium">Technical Details</p>
                  <ul className="mt-2 space-y-1 text-gray-600">
                    <li>• SIFT feature detection</li>
                    <li>• Optical flow estimation</li>
                    <li>• Motion vector analysis</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter>
          <Button
            onClick={handleUpload}
            disabled={!videoFile || isProcessing}
            className="w-full gap-2"
            size="lg"
          >
            {isProcessing ? (
              <>
                <span className="animate-pulse">Processing</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Start Object Tracking
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ObjectTracking;