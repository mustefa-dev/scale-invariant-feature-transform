
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";

const Index = () => {
  const [backendStatus, setBackendStatus] = useState<string>("Checking backend connection...");
  
  useEffect(() => {
    // Check if backend is running
    fetch('http://localhost:5000/api/health')
      .then(response => response.json())
      .then(data => {
        setBackendStatus("Connected to backend");
        toast.success("Connected to Flask backend");
      })
      .catch(error => {
        setBackendStatus("Backend connection failed");
        toast.error("Could not connect to Flask backend. Please ensure it's running.");
        console.error("Backend connection error:", error);
      });
  }, []);

  const applications = [
    {
      title: "Object Tracking Using SIFT Features",
      description: "Track objects in videos using SIFT keypoint features",
      comingSoon: true
    },
    {
      title: "Panorama Image Stitching Using SIFT and SURF",
      description: "Create panoramas by stitching overlapping images",
      comingSoon: true
    },
    {
      title: "Object Detection with SIFT Features",
      description: "Detect if an object appears in a scene using feature matching",
      comingSoon: true
    },
    {
      title: "Image Stitching with SIFT",
      description: "Stitch multiple images together using SIFT-based keypoint detection",
      comingSoon: true
    },
    {
      title: "Object Recognition Using SIFT",
      description: "Recognize objects by matching against a database of known objects",
      comingSoon: true
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
            Backend Status: <span className={backendStatus.includes("Connected") ? "text-green-500" : "text-red-500"}>
              {backendStatus}
            </span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {applications.map((app, index) => (
            <Card key={index} className="overflow-hidden">
              <CardHeader>
                <CardTitle>{app.title}</CardTitle>
                <CardDescription>{app.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-40 bg-gray-200 dark:bg-gray-800 rounded-md flex items-center justify-center">
                  <span className="text-gray-500 dark:text-gray-400">Application Preview</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" disabled={app.comingSoon}>
                  {app.comingSoon ? "Coming Soon" : "Try Now"}
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
