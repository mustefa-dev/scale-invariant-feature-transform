
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Compass, Image, Layers, Navigation, Route } from "lucide-react";

const FEATURES = [
  {
    title: "Image Stitching",
    description:
      "Combine multiple photos into a panoramic image using SIFT features to identify overlapping areas.",
    icon: <Image className="h-8 w-8" />,
    link: "/image-stitching",
  },
  {
    title: "Object Detection",
    description:
      "Detect if a specific object appears within a larger scene through feature matching.",
    icon: <Layers className="h-8 w-8" />,
    link: "/object-detection",
  },
  {
    title: "Object Recognition",
    description:
      "Recognize objects by comparing them against a database of known items using SIFT features.",
    icon: <Navigation className="h-8 w-8" />,
    link: "/object-recognition",
  },
  {
    title: "Object Tracking",
    description:
      "Track objects as they move across video frames to monitor their position over time.",
    icon: <Route className="h-8 w-8" />,
    link: "/object-tracking",
  },
  {
    title: "Robot Localization",
    description:
      "Determine robot position in unknown environments using trinocular stereo vision and SIFT keypoints.",
    icon: <Compass className="h-8 w-8" />,
    link: "/robot-localization",
  },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold tracking-tight mb-4">Computer Vision with SIFT</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Explore the power of Scale-Invariant Feature Transform (SIFT) algorithms
            for various computer vision applications
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {FEATURES.map((feature) => (
            <Card key={feature.title} className="flex flex-col">
              <CardHeader className="pb-2">
                <div className="mb-2">{feature.icon}</div>
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full">
                  <Link to={feature.link}>Try it now</Link>
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
