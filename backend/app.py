
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import os
import cv2
import numpy as np
import uuid
import time
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
# Configure CORS with environment variable
cors_origin = os.getenv('CORS_ORIGIN', 'http://localhost:3000')
CORS(app, resources={r"/api/*": {"origins": cors_origin}})

# Create directories for uploads and results if they don't exist
os.makedirs('static/uploads', exist_ok=True)
os.makedirs('static/results', exist_ok=True)

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "Flask backend is running!"})

@app.route('/api/upload', methods=['POST'])
def upload_file():
    """Generic file upload endpoint that saves files to static/uploads"""
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    files = request.files.getlist('file')
    if not files or files[0].filename == '':
        return jsonify({"error": "No file selected"}), 400
    
    saved_files = []
    
    for file in files:
        # Generate unique filename
        filename = str(uuid.uuid4()) + os.path.splitext(file.filename)[1]
        file_path = os.path.join('static/uploads', filename)
        file.save(file_path)
        saved_files.append(filename)
    
    return jsonify({
        "message": "Files uploaded successfully",
        "filenames": saved_files
    })

@app.route('/static/uploads/<filename>')
def serve_upload(filename):
    """Serve uploaded files"""
    return send_from_directory('static/uploads', filename)

@app.route('/static/results/<filename>')
def serve_result(filename):
    """Serve result files"""
    return send_from_directory('static/results', filename)

# ... keep existing code (stitch-images, detect-object, recognize-object, and track-object endpoints)

@app.route('/api/robot-localization', methods=['POST'])
def robot_localization():
    """Process trinocular stereo images to perform robot localization and mapping"""
    if 'images[]' not in request.files:
        return jsonify({"error": "No images provided"}), 400
    
    images = request.files.getlist('images[]')
    if len(images) != 3:
        return jsonify({"error": "Exactly 3 images are required for trinocular stereo"}), 400
    
    # Save uploaded images
    image_paths = []
    image_filenames = []
    for image in images:
        if image.filename == '':
            continue
        filename = str(uuid.uuid4()) + os.path.splitext(image.filename)[1]
        file_path = os.path.join('static/uploads', filename)
        image.save(file_path)
        image_paths.append(file_path)
        image_filenames.append(filename)
    
    if len(image_paths) != 3:
        return jsonify({"error": "Failed to save all three images"}), 400
    
    try:
        # Load images
        left_img = cv2.imread(image_paths[0], cv2.IMREAD_GRAYSCALE)
        center_img = cv2.imread(image_paths[1], cv2.IMREAD_GRAYSCALE)
        right_img = cv2.imread(image_paths[2], cv2.IMREAD_GRAYSCALE)
        
        # Ensure all images were loaded successfully
        if left_img is None or center_img is None or right_img is None:
            return jsonify({"error": "Failed to load images"}), 400
        
        # Initialize SIFT detector for feature detection
        sift = cv2.SIFT_create()
        
        # Detect keypoints and compute descriptors
        kp_left, des_left = sift.detectAndCompute(left_img, None)
        kp_center, des_center = sift.detectAndCompute(center_img, None)
        kp_right, des_right = sift.detectAndCompute(right_img, None)
        
        # Initialize FLANN matcher for feature matching
        FLANN_INDEX_KDTREE = 1
        index_params = dict(algorithm=FLANN_INDEX_KDTREE, trees=5)
        search_params = dict(checks=50)
        flann = cv2.FlannBasedMatcher(index_params, search_params)
        
        # Match left-center and center-right
        matches_lc = flann.knnMatch(des_left, des_center, k=2)
        matches_cr = flann.knnMatch(des_center, des_right, k=2)
        
        # Apply ratio test to get good matches
        good_matches_lc = []
        for m, n in matches_lc:
            if m.distance < 0.7 * n.distance:
                good_matches_lc.append(m)
        
        good_matches_cr = []
        for m, n in matches_cr:
            if m.distance < 0.7 * n.distance:
                good_matches_cr.append(m)
        
        # Get matching keypoints
        left_pts = np.float32([kp_left[m.queryIdx].pt for m in good_matches_lc]).reshape(-1, 1, 2)
        center_pts1 = np.float32([kp_center[m.trainIdx].pt for m in good_matches_lc]).reshape(-1, 1, 2)
        center_pts2 = np.float32([kp_center[m.queryIdx].pt for m in good_matches_cr]).reshape(-1, 1, 2)
        right_pts = np.float32([kp_right[m.trainIdx].pt for m in good_matches_cr]).reshape(-1, 1, 2)
        
        # Calculate fundamental matrices
        F_lc, mask_lc = cv2.findFundamentalMat(left_pts, center_pts1, cv2.FM_RANSAC, 3, 0.99)
        F_cr, mask_cr = cv2.findFundamentalMat(center_pts2, right_pts, cv2.FM_RANSAC, 3, 0.99)
        
        # Use only inliers for triangulation
        mask_lc = mask_lc.ravel().astype(bool)
        mask_cr = mask_cr.ravel().astype(bool)
        
        left_pts = left_pts[mask_lc]
        center_pts1 = center_pts1[mask_lc]
        center_pts2 = center_pts2[mask_cr]
        right_pts = right_pts[mask_cr]
        
        # Simulate camera calibration parameters (in a real system, these would be calibrated)
        # These are simplified values for demonstration
        focal_length = 1000  # pixels
        center_x = left_img.shape[1] / 2
        center_y = left_img.shape[0] / 2
        baseline = 0.1  # meters between cameras
        
        # Camera intrinsics matrix
        K = np.array([
            [focal_length, 0, center_x],
            [0, focal_length, center_y],
            [0, 0, 1]
        ])
        
        # Define camera matrices (simplified setup)
        # Left camera is at origin
        P_left = np.hstack((K, np.zeros((3, 1))))
        
        # Center camera is translated along X-axis
        R_center = np.eye(3)
        t_center = np.array([[baseline, 0, 0]]).T
        P_center = np.dot(K, np.hstack((R_center, t_center)))
        
        # Right camera is further translated along X-axis
        R_right = np.eye(3)
        t_right = np.array([[2 * baseline, 0, 0]]).T
        P_right = np.dot(K, np.hstack((R_right, t_right)))
        
        # Triangulate 3D points from left-center stereo pair
        points_4d = cv2.triangulatePoints(P_left, P_center, left_pts.reshape(-1, 2).T, center_pts1.reshape(-1, 2).T)
        
        # Convert to homogeneous coordinates
        points_3d = points_4d[:3, :] / points_4d[3, :]
        
        # Convert to list of 3D points for output
        keypoints_3d = []
        for i in range(points_3d.shape[1]):
            x, y, z = points_3d[0, i], points_3d[1, i], points_3d[2, i]
            # Filter out points that are too far or have negative z
            if -10 < x < 10 and -10 < y < 10 and 0 < z < 20:
                keypoints_3d.append({
                    "x": float(x),
                    "y": float(y),
                    "z": float(z)
                })
        
        # Simulate robot pose calculation from the point cloud
        # In a real system, this would involve more complex SLAM algorithms
        robot_x = np.mean([p["x"] for p in keypoints_3d])
        robot_y = np.mean([p["y"] for p in keypoints_3d])
        robot_z = np.mean([p["z"] for p in keypoints_3d])
        
        # Get median values for more robust position estimate
        robot_x_median = float(np.median([p["x"] for p in keypoints_3d]))
        robot_y_median = float(np.median([p["y"] for p in keypoints_3d]))
        robot_z_median = float(np.median([p["z"] for p in keypoints_3d]))
        
        # Simulate robot orientation (would be calculated from visual odometry in a real system)
        roll = np.random.uniform(-5, 5)  # degrees
        pitch = np.random.uniform(-5, 5)  # degrees
        yaw = np.random.uniform(-10, 10)  # degrees
        
        # Generate a simple map visualization
        map_width, map_height = 800, 600
        map_img = np.ones((map_height, map_width, 3), dtype=np.uint8) * 255
        
        # Scale factor to convert 3D coordinates to pixel coordinates
        scale = min(map_width / 20, map_height / 20)
        center_x, center_y = map_width // 2, map_height // 2
        
        # Draw grid lines
        for i in range(-10, 11, 1):
            # X grid lines
            x1, y1 = int(center_x + i * scale), 0
            x2, y2 = int(center_x + i * scale), map_height
            cv2.line(map_img, (x1, y1), (x2, y2), (220, 220, 220), 1)
            
            # Y grid lines
            x1, y1 = 0, int(center_y - i * scale)
            x2, y2 = map_width, int(center_y - i * scale)
            cv2.line(map_img, (x1, y1), (x2, y2), (220, 220, 220), 1)
        
        # Draw X and Y axes
        cv2.line(map_img, (0, center_y), (map_width, center_y), (150, 150, 150), 2)  # X-axis
        cv2.line(map_img, (center_x, map_height), (center_x, 0), (150, 150, 150), 2)  # Y-axis
        
        # Draw 3D points on map
        for point in keypoints_3d:
            x = int(center_x + point["x"] * scale)
            y = int(center_y - point["y"] * scale)  # Flip Y for image coordinates
            
            if 0 <= x < map_width and 0 <= y < map_height:
                # Color based on height (Z value)
                z_normalized = max(0, min(1, point["z"] / 5))
                color = (int(255 * (1 - z_normalized)), 
                         int(100 + 155 * z_normalized), 
                         int(255 * z_normalized))
                cv2.circle(map_img, (x, y), 2, color, -1)
        
        # Draw robot position
        robot_map_x = int(center_x + robot_x_median * scale)
        robot_map_y = int(center_y - robot_y_median * scale)
        cv2.circle(map_img, (robot_map_x, robot_map_y), 10, (0, 0, 255), -1)
        
        # Draw robot direction (based on yaw)
        direction_length = 30
        dx = direction_length * np.cos(np.radians(yaw))
        dy = direction_length * np.sin(np.radians(yaw))
        cv2.line(map_img, 
                 (robot_map_x, robot_map_y),
                 (int(robot_map_x + dx), int(robot_map_y - dy)), 
                 (0, 0, 255), 3)
        
        # Generate simulated trajectory
        trajectory_points = []
        num_trajectory_points = 10
        
        for i in range(num_trajectory_points):
            # Generate points along a simulated path
            t = i / (num_trajectory_points - 1) if num_trajectory_points > 1 else 0
            x = robot_x_median - t * 2
            y = robot_y_median - t * 1.5 * np.sin(t * 2)
            z = robot_z_median
            
            trajectory_points.append({
                "position": {"x": float(x), "y": float(y), "z": float(z)},
                "timestamp": int(time.time() - (num_trajectory_points - i) * 1000)
            })
            
            # Draw trajectory on map
            if i > 0:
                prev_x = int(center_x + trajectory_points[i-1]["position"]["x"] * scale)
                prev_y = int(center_y - trajectory_points[i-1]["position"]["y"] * scale)
                curr_x = int(center_x + x * scale)
                curr_y = int(center_y - y * scale)
                cv2.line(map_img, (prev_x, prev_y), (curr_x, curr_y), (0, 255, 0), 2)
        
        # Add a legend
        legend_x, legend_y = 20, 20
        cv2.putText(map_img, "Robot Position", (legend_x, legend_y), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 1)
        cv2.putText(map_img, "Trajectory", (legend_x, legend_y + 20), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)
        cv2.putText(map_img, "3D Points", (legend_x, legend_y + 40), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (100, 100, 255), 1)
        
        # Save the map image
        map_filename = f"map_{uuid.uuid4()}.png"
        map_path = os.path.join('static/results', map_filename)
        cv2.imwrite(map_path, map_img)
        
        # Draw matched keypoints on images for visualization
        left_img_color = cv2.imread(image_paths[0])
        center_img_color = cv2.imread(image_paths[1])
        right_img_color = cv2.imread(image_paths[2])
        
        # Draw keypoints on left image
        for pt in left_pts:
            x, y = int(pt[0][0]), int(pt[0][1])
            cv2.circle(left_img_color, (x, y), 4, (0, 255, 0), -1)
        
        # Draw keypoints on center image
        for pt in np.vstack([center_pts1, center_pts2]):
            x, y = int(pt[0][0]), int(pt[0][1])
            cv2.circle(center_img_color, (x, y), 4, (0, 255, 0), -1)
        
        # Draw keypoints on right image
        for pt in right_pts:
            x, y = int(pt[0][0]), int(pt[0][1])
            cv2.circle(right_img_color, (x, y), 4, (0, 255, 0), -1)
        
        # Save visualization images
        vis_left_filename = f"vis_left_{uuid.uuid4()}.jpg"
        vis_center_filename = f"vis_center_{uuid.uuid4()}.jpg"
        vis_right_filename = f"vis_right_{uuid.uuid4()}.jpg"
        
        vis_left_path = os.path.join('static/results', vis_left_filename)
        vis_center_path = os.path.join('static/results', vis_center_filename)
        vis_right_path = os.path.join('static/results', vis_right_filename)
        
        cv2.imwrite(vis_left_path, left_img_color)
        cv2.imwrite(vis_center_path, center_img_color)
        cv2.imwrite(vis_right_path, right_img_color)
        
        # Calculate confidence based on number of good matches
        confidence = min(100, len(keypoints_3d) / 5 * 100)
        
        return jsonify({
            "message": "Robot localization processed successfully",
            "keypoints_3d": keypoints_3d,
            "robot_position": {
                "x": robot_x_median,
                "y": robot_y_median,
                "z": robot_z_median
            },
            "robot_orientation": {
                "roll": float(roll),
                "pitch": float(pitch),
                "yaw": float(yaw)
            },
            "robot_pose": {
                "position": {
                    "x": robot_x_median,
                    "y": robot_y_median,
                    "z": robot_z_median
                },
                "orientation": {
                    "roll": float(roll),
                    "pitch": float(pitch),
                    "yaw": float(yaw)
                }
            },
            "trajectory": trajectory_points,
            "confidence": float(confidence),
            "keypoints_count": len(keypoints_3d),
            "matching_points": len(good_matches_lc) + len(good_matches_cr),
            "map_image": map_filename,
            "visualizations": {
                "left_image": vis_left_filename,
                "center_image": vis_center_filename,
                "right_image": vis_right_filename
            },
            "original_images": image_filenames
        })
    
    except Exception as e:
        return jsonify({"error": f"Error processing images: {str(e)}"}), 500

# Make sure Flask serves static files
@app.route('/')
def index():
    return jsonify({"message": "SIFT Computer Vision API is running"})

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    host = os.getenv('HOST', '0.0.0.0')
    debug = os.getenv('DEBUG', 'False').lower() == 'true'
    app.run(debug=debug, host=host, port=port)
