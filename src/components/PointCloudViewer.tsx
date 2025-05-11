
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Point3D, RobotPose } from '@/types/robot';

interface PointCloudViewerProps {
  points: Point3D[];
  robotPose: RobotPose;
}

const PointCloudViewer: React.FC<PointCloudViewerProps> = ({ points, robotPose }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Set up scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    
    // Add grid helper
    const gridHelper = new THREE.GridHelper(10, 10);
    scene.add(gridHelper);
    
    // Add axes helper
    const axesHelper = new THREE.AxesHelper(2);
    scene.add(axesHelper);
    
    // Set up camera
    const container = containerRef.current;
    const camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 5;
    camera.position.y = 3;
    camera.position.x = 3;
    camera.lookAt(0, 0, 0);
    
    // Set up renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);
    
    // Add orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    
    // Create point cloud
    const geometry = new THREE.BufferGeometry();
    const positions: number[] = [];
    const colors: number[] = [];
    const color = new THREE.Color();
    
    points.forEach((point) => {
      // Add vertex position
      positions.push(point.x, point.y, point.z);
      
      // Assign color based on height (y) value for better visualization
      const normalizedHeight = (point.y - Math.min(...points.map(p => p.y))) / 
        (Math.max(...points.map(p => p.y)) - Math.min(...points.map(p => p.y)) || 1);
      
      // Color gradient from blue to red
      color.setHSL(0.7 - normalizedHeight * 0.7, 1.0, 0.5);
      colors.push(color.r, color.g, color.b);
    });
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    const material = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
    });
    
    const pointCloud = new THREE.Points(geometry, material);
    scene.add(pointCloud);
    
    // Add robot model
    const robotGeometry = new THREE.ConeGeometry(0.3, 0.8, 8);
    robotGeometry.rotateX(Math.PI / 2);
    const robotMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const robot = new THREE.Mesh(robotGeometry, robotMaterial);
    
    // Set robot position
    robot.position.set(
      robotPose.position.x,
      robotPose.position.y,
      robotPose.position.z
    );
    
    // Convert Euler angles from degrees to radians
    const rollRad = robotPose.orientation.roll * (Math.PI / 180);
    const pitchRad = robotPose.orientation.pitch * (Math.PI / 180);
    const yawRad = robotPose.orientation.yaw * (Math.PI / 180);
    
    // Apply rotation
    const euler = new THREE.Euler(rollRad, yawRad, pitchRad, 'XYZ');
    robot.setRotationFromEuler(euler);
    
    scene.add(robot);
    
    // Add robot path/trajectory line
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });
    const lineGeometry = new THREE.BufferGeometry();
    
    // Just use a simple path for visualization (you can enhance this with actual trajectory data)
    const linePath = [
      new THREE.Vector3(robotPose.position.x - 1, robotPose.position.y, robotPose.position.z),
      new THREE.Vector3(robotPose.position.x, robotPose.position.y, robotPose.position.z)
    ];
    
    lineGeometry.setFromPoints(linePath);
    const line = new THREE.Line(lineGeometry, lineMaterial);
    scene.add(line);
    
    // Handle window resize
    const handleResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    
    animate();
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      container.removeChild(renderer.domElement);
      scene.clear();
    };
  }, [points, robotPose]);
  
  return <div ref={containerRef} className="w-full h-full"></div>;
};

export default PointCloudViewer;
