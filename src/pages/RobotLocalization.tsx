
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Compass, Layers, Route } from "lucide-react";
import { toast } from "sonner";
import { uploadFiles, getImageUrl } from "@/utils/api";
import RobotMap from "@/components/RobotMap";
import PointCloudViewer from "@/components/PointCloudViewer";
import { RobotLocalizationResult } from "@/types/robot";

const RobotLocalization = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [leftImage, setLeftImage] = useState<File | null>(null);
  const [centerImage, setCenterImage] = useState<File | null>(null);
  const [rightImage, setRightImage] = useState<File | null>(null);
  const [result, setResult] = useState<RobotLocalizationResult | null>(null);
  const [activeTab, setActiveTab] = useState("map");

  const handleLeftImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLeftImage(e.target.files[0]);
    }
  };

  const handleCenterImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCenterImage(e.target.files[0]);
    }
  };

  const handleRightImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setRightImage(e.target.files[0]);
    }
  };

  const processImages = async () => {
    if (!leftImage || !centerImage || !rightImage) {
      toast.error("Please upload all three stereo images");
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("left_image", leftImage);
      formData.append("center_image", centerImage);
      formData.append("right_image", rightImage);

      const response = await uploadFiles("/api/robot-localization", [
        leftImage, 
        centerImage, 
        rightImage
      ], "images[]");

      setResult(response);
      toast.success("Robot localization completed successfully");
      setActiveTab("map");
    } catch (error) {
      console.error("Error during localization:", error);
      toast.error("Failed to process stereo images");
    } finally {
      setIsLoading(false);
    }
  };

  const clearData = () => {
    setLeftImage(null);
    setCenterImage(null);
    setRightImage(null);
    setResult(null);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Robot Localization & Mapping</h1>
        <p className="text-muted-foreground">
          Upload trinocular stereo images to generate 3D keypoint estimates and determine robot position
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Left Camera Image</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="left-image">Upload Image</Label>
                <Input 
                  id="left-image" 
                  type="file"
                  accept="image/*"
                  onChange={handleLeftImageChange}
                  disabled={isLoading}
                />
              </div>
              {leftImage && (
                <div className="relative aspect-video bg-muted rounded-md overflow-hidden">
                  <img 
                    src={URL.createObjectURL(leftImage)} 
                    alt="Left camera view" 
                    className="object-cover w-full h-full"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Center Camera Image</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="center-image">Upload Image</Label>
                <Input 
                  id="center-image" 
                  type="file"
                  accept="image/*"
                  onChange={handleCenterImageChange}
                  disabled={isLoading}
                />
              </div>
              {centerImage && (
                <div className="relative aspect-video bg-muted rounded-md overflow-hidden">
                  <img 
                    src={URL.createObjectURL(centerImage)} 
                    alt="Center camera view" 
                    className="object-cover w-full h-full"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Right Camera Image</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="right-image">Upload Image</Label>
                <Input 
                  id="right-image" 
                  type="file"
                  accept="image/*"
                  onChange={handleRightImageChange}
                  disabled={isLoading}
                />
              </div>
              {rightImage && (
                <div className="relative aspect-video bg-muted rounded-md overflow-hidden">
                  <img 
                    src={URL.createObjectURL(rightImage)} 
                    alt="Right camera view" 
                    className="object-cover w-full h-full"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center gap-4 mb-8">
        <Button
          onClick={processImages}
          disabled={isLoading || !leftImage || !centerImage || !rightImage}
        >
          {isLoading ? "Processing..." : "Process Stereo Images"}
        </Button>
        <Button variant="outline" onClick={clearData} disabled={isLoading}>
          Clear
        </Button>
      </div>

      {result && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Localization Results</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="map" className="flex items-center gap-2">
                  <Route className="h-4 w-4" />
                  <span>Robot Map</span>
                </TabsTrigger>
                <TabsTrigger value="pointcloud" className="flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  <span>3D Point Cloud</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="map" className="mt-0">
                <div className="h-[500px] bg-muted rounded-md overflow-hidden">
                  <RobotMap 
                    keypoints={result.keypoints_3d}
                    robotPosition={result.robot_position}
                    trajectory={result.trajectory}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="pointcloud" className="mt-0">
                <div className="h-[500px] bg-muted rounded-md overflow-hidden">
                  <PointCloudViewer 
                    points={result.keypoints_3d}
                    robotPose={result.robot_pose}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Position Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <Compass className="h-4 w-4" />
                  Current Position
                </h3>
                <p className="text-sm text-muted-foreground mb-1">X: {result.robot_position.x.toFixed(3)}</p>
                <p className="text-sm text-muted-foreground mb-1">Y: {result.robot_position.y.toFixed(3)}</p>
                <p className="text-sm text-muted-foreground">Z: {result.robot_position.z.toFixed(3)}</p>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Orientation (Euler angles)</h3>
                <p className="text-sm text-muted-foreground mb-1">Roll: {result.robot_orientation.roll.toFixed(3)}°</p>
                <p className="text-sm text-muted-foreground mb-1">Pitch: {result.robot_orientation.pitch.toFixed(3)}°</p>
                <p className="text-sm text-muted-foreground">Yaw: {result.robot_orientation.yaw.toFixed(3)}°</p>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Statistics</h3>
                <p className="text-sm text-muted-foreground mb-1">Detected keypoints: {result.keypoints_count}</p>
                <p className="text-sm text-muted-foreground mb-1">Matching points: {result.matching_points}</p>
                <p className="text-sm text-muted-foreground">Localization confidence: {result.confidence.toFixed(1)}%</p>
              </div>
            </div>

            {result.map_image && (
              <div className="mt-6">
                <h3 className="font-medium mb-2">Generated Map</h3>
                <div className="border rounded-md overflow-hidden">
                  <img 
                    src={getImageUrl(result.map_image)} 
                    alt="Generated map" 
                    className="w-full h-auto"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RobotLocalization;
