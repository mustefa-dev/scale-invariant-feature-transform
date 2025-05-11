
export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface RobotOrientation {
  roll: number;  // x-axis rotation in degrees
  pitch: number; // y-axis rotation in degrees
  yaw: number;   // z-axis rotation in degrees
}

export interface RobotPose {
  position: Point3D;
  orientation: RobotOrientation;
}

export interface TrajectoryPoint {
  position: Point3D;
  timestamp: number;
}

export interface RobotLocalizationResult {
  keypoints_3d: Point3D[];
  robot_position: Point3D;
  robot_orientation: RobotOrientation;
  robot_pose: RobotPose;
  trajectory: TrajectoryPoint[];
  confidence: number;
  keypoints_count: number;
  matching_points: number;
  map_image: string;
}
