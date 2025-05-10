
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, Play } from "lucide-react";

const ObjectTracking = () => {
  const navigate = useNavigate();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [result, setResult] = useState<{
    video_filename: string;
    thumbnail_filename: string;
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVideoFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!videoFile) {
      toast.error("Please select a video file first");
      return;
    }

    setIsProcessing(true);
    const formData = new FormData();
    formData.append("video", videoFile);

    try {
      const response = await fetch("http://localhost:5000/api/track-object", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setResult(data);
      toast.success("Video processed successfully!");
    } catch (error) {
      console.error("Error processing video:", error);
      toast.error("Failed to process video. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Button 
        variant="outline" 
        onClick={() => navigate("/")} 
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
      </Button>
      
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Object Tracking Using SIFT Features</h1>
        <p className="text-gray-600 mt-2">
          Track objects throughout a video sequence using SIFT keypoint features
        </p>
      </div>
      
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Upload Video</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center w-full">
            <label 
              htmlFor="video-upload" 
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-10 h-10 mb-3 text-gray-400" />
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">MP4, AVI, MOV (MAX. 50MB)</p>
              </div>
              <input 
                id="video-upload" 
                type="file" 
                className="hidden" 
                accept="video/*"
                onChange={handleFileChange}
              />
            </label>
          </div>
          
          {videoFile && (
            <div className="text-sm text-center">
              Selected video: <span className="font-medium">{videoFile.name}</span>
            </div>
          )}

          {result && (
            <div className="mt-6 space-y-4">
              <h3 className="text-lg font-medium">Tracking Results</h3>
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <img 
                  src={`http://localhost:5000/static/results/${result.thumbnail_filename}`}
                  alt="Tracking thumbnail" 
                  className="w-full h-32 object-contain"
                />
                <video 
                  controls 
                  className="w-full" 
                  src={`http://localhost:5000/static/results/${result.video_filename}`}
                />
              </div>
              <p className="text-sm text-gray-500 text-center">
                Object tracked using SIFT features
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleUpload}
            disabled={!videoFile || isProcessing}
            className="w-full"
          >
            {isProcessing ? (
              <>Processing...</>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" /> Process Video
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ObjectTracking;
