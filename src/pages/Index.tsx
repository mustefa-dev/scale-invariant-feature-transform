
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Eye, Image, Layers, Search, Camera } from "lucide-react";
import { fetchAPI } from "@/utils/api";
import config from "@/config";

const Index = () => {
  const [backendStatus, setBackendStatus] = useState<string>("Checking backend connection...");
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if backend is running
    fetchAPI('/api/health')
      .then(data => {
        setBackendStatus("Connected to backend");
        toast.success("Connected to Flask backend");
      })
      .catch(error => {
        setBackendStatus("Backend connection failed");
        toast.error(`Could not connect to Flask backend at ${config.apiUrl}. Please ensure it's running.`);
        console.error("Backend connection error:", error);
      });
  }, []);

  const applications = [
    {
      title: "Object Tracking Using SIFT Features",
      description: "Track objects in videos using SIFT keypoint features",
      path: "/object-tracking",
      icon: <Eye className="h-10 w-10 text-blue-500" />
    },
    {
      title: "Panorama Image Stitching Using SIFT and SURF",
      description: "Create panoramas by stitching overlapping images",
      path: "/panorama-stitching",
      icon: <Layers className="h-10 w-10 text-green-500" />
    },
    {
      title: "Object Detection with SIFT Features",
      description: "Detect if an object appears in a scene using feature matching",
      path: "/object-detection",
      icon: <Search className="h-10 w-10 text-purple-500" />
    },
    {
      title: "Image Stitching with SIFT",
      description: "Stitch multiple images together using SIFT-based keypoint detection",
      path: "/image-stitching",
      icon: <Image className="h-10 w-10 text-orange-500" />
    },
    {
      title: "Object Recognition Using SIFT",
      description: "Recognize objects by matching against a database of known objects",
      path: "/object-recognition",
      icon: <Camera className="h-10 w-10 text-red-500" />
    }
  ];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-4">Computer Vision Applications</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Explore the power of SIFT algorithm in various computer vision tasks
          </p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Backend Status: 
            <span className={
              backendStatus.includes("Connected") 
                ? "text-green-500 ml-1 font-medium" 
                : "text-red-500 ml-1 font-medium"
            }>
              {backendStatus}
            </span>
            {backendStatus.includes("failed") && (
              <div className="mt-1 flex items-center justify-center">
                <AlertCircle className="h-4 w-4 text-red-500 mr-1" />
                <span className="text-xs text-red-500">
                  Please run the Flask backend with: <code className="bg-gray-200 px-1 py-0.5 rounded text-red-600">python backend/app.py</code>
                </span>
              </div>
            )}
          </p>
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-md max-w-2xl mx-auto">
            <h2 className="text-lg font-medium mb-1">Deployment Information</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Current environment: <code className="bg-gray-200 dark:bg-gray-800 px-1 py-0.5 rounded">{import.meta.env.MODE}</code>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              API URL: <code className="bg-gray-200 dark:bg-gray-800 px-1 py-0.5 rounded">{config.apiUrl}</code>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {applications.map((app, index) => (
            <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>{app.title}</CardTitle>
                <CardDescription>{app.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-40 bg-gray-200 dark:bg-gray-800 rounded-md flex items-center justify-center">
                  {app.icon}
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full"
                  disabled={backendStatus.includes("failed")}
                  onClick={() => navigate(app.path)}
                >
                  {backendStatus.includes("Connected") ? "Try Now" : "Backend Required"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;
