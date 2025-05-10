
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, Search } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ObjectDetection = () => {
  const navigate = useNavigate();
  const [objectImage, setObjectImage] = useState<File | null>(null);
  const [sceneImage, setSceneImage] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [result, setResult] = useState<{
    detected: boolean;
    message: string;
    result_filename: string;
    matches_filename: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<string>("upload");

  const handleObjectFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setObjectImage(e.target.files[0]);
    }
  };

  const handleSceneFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSceneImage(e.target.files[0]);
    }
  };

  const handleDetect = async () => {
    if (!objectImage || !sceneImage) {
      toast.error("Please select both object and scene images");
      return;
    }

    setIsProcessing(true);
    const formData = new FormData();
    formData.append("object", objectImage);
    formData.append("scene", sceneImage);

    try {
      const response = await fetch("http://localhost:5000/api/detect-object", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setResult(data);
      setActiveTab("results");
      toast.success(data.message);
    } catch (error) {
      console.error("Error detecting object:", error);
      toast.error("Failed to detect object. Please try again.");
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
        <h1 className="text-3xl font-bold">Object Detection with SIFT Features</h1>
        <p className="text-gray-600 mt-2">
          Detect if a specific object appears in a scene using feature matching
        </p>
      </div>
      
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Detect Objects in Scenes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="upload">Upload</TabsTrigger>
              <TabsTrigger value="results" disabled={!result}>Results</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload" className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Object to detect:</h3>
                <label 
                  htmlFor="object-upload" 
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                >
                  {objectImage ? (
                    <img 
                      src={URL.createObjectURL(objectImage)} 
                      alt="Object" 
                      className="h-full w-auto object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-gray-400" />
                      <p className="text-sm text-gray-500">
                        Upload object image
                      </p>
                    </div>
                  )}
                  <input 
                    id="object-upload" 
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleObjectFileChange}
                  />
                </label>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">Scene to search in:</h3>
                <label 
                  htmlFor="scene-upload" 
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                >
                  {sceneImage ? (
                    <img 
                      src={URL.createObjectURL(sceneImage)} 
                      alt="Scene" 
                      className="h-full w-auto object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-gray-400" />
                      <p className="text-sm text-gray-500">
                        Upload scene image
                      </p>
                    </div>
                  )}
                  <input 
                    id="scene-upload" 
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleSceneFileChange}
                  />
                </label>
              </div>
            </TabsContent>
            
            <TabsContent value="results" className="space-y-6">
              {result && (
                <>
                  <div className="text-center p-4 rounded-lg bg-gray-50 border">
                    <h3 className={`text-xl font-medium ${result.detected ? 'text-green-600' : 'text-red-500'}`}>
                      {result.detected ? 'Object Detected!' : 'Object Not Found'}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">{result.message}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-2">Detection Result:</h3>
                    <div className="bg-gray-100 rounded-lg overflow-hidden">
                      <img 
                        src={`http://localhost:5000/static/results/${result.result_filename}`}
                        alt="Detection result" 
                        className="w-full h-auto"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-2">Feature Matches:</h3>
                    <div className="bg-gray-100 rounded-lg overflow-hidden">
                      <img 
                        src={`http://localhost:5000/static/results/${result.matches_filename}`}
                        alt="Feature matches" 
                        className="w-full h-auto"
                      />
                    </div>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter>
          {activeTab === "upload" ? (
            <Button 
              onClick={handleDetect}
              disabled={!objectImage || !sceneImage || isProcessing}
              className="w-full"
            >
              {isProcessing ? "Processing..." : (
                <>
                  <Search className="mr-2 h-4 w-4" /> Detect Object
                </>
              )}
            </Button>
          ) : (
            <Button 
              variant="outline"
              onClick={() => setActiveTab("upload")}
              className="w-full"
            >
              Try Another Detection
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default ObjectDetection;
