
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, Plus, X } from "lucide-react";

const PanoramaStitching = () => {
  const navigate = useNavigate();
  const [images, setImages] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [result, setResult] = useState<{ result_filename: string } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files);
      setImages(prev => [...prev, ...newImages]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleStitch = async () => {
    if (images.length < 2) {
      toast.error("Please select at least 2 images for stitching");
      return;
    }

    setIsProcessing(true);
    const formData = new FormData();
    
    images.forEach(image => {
      formData.append("files[]", image);
    });

    try {
      const response = await fetch("http://localhost:5000/api/stitch-images", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setResult(data);
      toast.success("Images stitched successfully!");
    } catch (error) {
      console.error("Error stitching images:", error);
      toast.error("Failed to stitch images. Please try with different images.");
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
        <h1 className="text-3xl font-bold">Panorama Image Stitching</h1>
        <p className="text-gray-600 mt-2">
          Create panorama images by stitching multiple overlapping photos
        </p>
      </div>
      
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Upload Images for Stitching</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center w-full">
            <label 
              htmlFor="image-upload" 
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-10 h-10 mb-3 text-gray-400" />
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">PNG, JPG, WebP (MAX. 10MB per image)</p>
              </div>
              <input 
                id="image-upload" 
                type="file" 
                className="hidden" 
                accept="image/*" 
                multiple
                onChange={handleFileChange}
              />
            </label>
          </div>
          
          {images.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">Selected Images ({images.length})</h3>
              <div className="grid grid-cols-3 gap-2">
                {images.map((image, index) => (
                  <div key={index} className="relative">
                    <img 
                      src={URL.createObjectURL(image)} 
                      alt={`Upload ${index + 1}`} 
                      className="h-20 w-full object-cover rounded-md"
                    />
                    <button 
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                      onClick={() => removeImage(index)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <label 
                  htmlFor="add-more-images" 
                  className="h-20 border-2 border-dashed rounded-md flex items-center justify-center cursor-pointer bg-gray-50 hover:bg-gray-100"
                >
                  <Plus className="h-6 w-6 text-gray-400" />
                  <input 
                    id="add-more-images" 
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    multiple
                    onChange={handleFileChange}
                  />
                </label>
              </div>
            </div>
          )}

          {result && (
            <div className="mt-6 space-y-4">
              <h3 className="text-lg font-medium">Stitching Result</h3>
              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                <img 
                  src={`http://localhost:5000/static/results/${result.result_filename}`}
                  alt="Stitched panorama" 
                  className="max-w-full max-h-[400px] object-contain"
                />
              </div>
              <p className="text-sm text-gray-500 text-center">
                Images stitched using SIFT features
              </p>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = `http://localhost:5000/static/results/${result.result_filename}`;
                  link.download = `panorama.jpg`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
              >
                Download Panorama
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleStitch}
            disabled={images.length < 2 || isProcessing}
            className="w-full"
          >
            {isProcessing ? "Processing..." : "Stitch Images"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PanoramaStitching;
