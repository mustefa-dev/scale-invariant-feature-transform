
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, Plus, X, Search } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ObjectRecognition = () => {
  const navigate = useNavigate();
  const [queryImage, setQueryImage] = useState<File | null>(null);
  const [knownObjects, setKnownObjects] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [result, setResult] = useState<{
    recognized: boolean;
    message: string;
    matches_filename?: string;
    query_filename: string;
    matching_object_filename?: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<string>("upload");

  const handleQueryFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setQueryImage(e.target.files[0]);
    }
  };

  const handleKnownObjectsFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files);
      setKnownObjects(prev => [...prev, ...newImages]);
    }
  };

  const removeKnownObject = (index: number) => {
    setKnownObjects(prev => prev.filter((_, i) => i !== index));
  };

  const handleRecognize = async () => {
    if (!queryImage || knownObjects.length === 0) {
      toast.error("Please select a query image and at least one known object");
      return;
    }

    setIsProcessing(true);
    const formData = new FormData();
    formData.append("query", queryImage);
    
    knownObjects.forEach(obj => {
      formData.append("known_objects[]", obj);
    });

    try {
      const response = await fetch("http://localhost:5000/api/recognize-object", {
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
      console.error("Error recognizing object:", error);
      toast.error("Failed to recognize object. Please try again.");
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
        <h1 className="text-3xl font-bold">Object Recognition Using SIFT</h1>
        <p className="text-gray-600 mt-2">
          Recognize objects by matching against a database of known objects
        </p>
      </div>
      
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Recognize Objects</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="upload">Upload</TabsTrigger>
              <TabsTrigger value="results" disabled={!result}>Results</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload" className="space-y-6">
              <div>
                <h3 className="text-sm font-medium mb-2">Query image to recognize:</h3>
                <label 
                  htmlFor="query-upload" 
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                >
                  {queryImage ? (
                    <img 
                      src={URL.createObjectURL(queryImage)} 
                      alt="Query" 
                      className="h-full w-auto object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-gray-400" />
                      <p className="text-sm text-gray-500">
                        Upload query image
                      </p>
                    </div>
                  )}
                  <input 
                    id="query-upload" 
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleQueryFileChange}
                  />
                </label>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">Database of known objects:</h3>
                <div className="grid grid-cols-3 gap-2">
                  {knownObjects.map((obj, index) => (
                    <div key={index} className="relative">
                      <img 
                        src={URL.createObjectURL(obj)} 
                        alt={`Known object ${index}`} 
                        className="h-24 w-full object-cover rounded-md"
                      />
                      <button 
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                        onClick={() => removeKnownObject(index)}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  <label 
                    htmlFor="known-objects-upload" 
                    className="h-24 border-2 border-dashed rounded-md flex items-center justify-center cursor-pointer bg-gray-50 hover:bg-gray-100"
                  >
                    <Plus className="h-6 w-6 text-gray-400" />
                    <input 
                      id="known-objects-upload" 
                      type="file" 
                      className="hidden" 
                      accept="image/*" 
                      multiple
                      onChange={handleKnownObjectsFileChange}
                    />
                  </label>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="results" className="space-y-6">
              {result && (
                <>
                  <div className="text-center p-4 rounded-lg bg-gray-50 border">
                    <h3 className={`text-xl font-medium ${result.recognized ? 'text-green-600' : 'text-red-500'}`}>
                      {result.recognized ? 'Object Recognized!' : 'Object Not Recognized'}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">{result.message}</p>
                  </div>
                  
                  {result.recognized && result.matches_filename && (
                    <div>
                      <h3 className="text-sm font-medium mb-2">Match Result:</h3>
                      <div className="bg-gray-100 rounded-lg overflow-hidden">
                        <img 
                          src={`http://localhost:5000/static/results/${result.matches_filename}`}
                          alt="Recognition result" 
                          className="w-full h-auto"
                        />
                      </div>
                    </div>
                  )}
                  
                  {!result.recognized && (
                    <div>
                      <h3 className="text-sm font-medium mb-2">Query Image:</h3>
                      <div className="bg-gray-100 rounded-lg overflow-hidden">
                        <img 
                          src={`http://localhost:5000/static/uploads/${result.query_filename}`}
                          alt="Query image" 
                          className="w-full h-auto object-contain max-h-64"
                        />
                      </div>
                      <p className="text-sm text-gray-500 text-center mt-2">
                        No matching object found in the database
                      </p>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter>
          {activeTab === "upload" ? (
            <Button 
              onClick={handleRecognize}
              disabled={!queryImage || knownObjects.length === 0 || isProcessing}
              className="w-full"
            >
              {isProcessing ? "Processing..." : (
                <>
                  <Search className="mr-2 h-4 w-4" /> Recognize Object
                </>
              )}
            </Button>
          ) : (
            <Button 
              variant="outline"
              onClick={() => setActiveTab("upload")}
              className="w-full"
            >
              Try Another Recognition
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default ObjectRecognition;
