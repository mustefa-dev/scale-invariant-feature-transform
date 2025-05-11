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

@app.route('/api/stitch-images', methods=['POST'])
def stitch_images():
    """Stitch images using SIFT features"""
    if 'files[]' not in request.files:
        return jsonify({"error": "No files part"}), 400
    
    files = request.files.getlist('files[]')
    if len(files) < 2:
        return jsonify({"error": "At least 2 images are required for stitching"}), 400
    
    # Save uploaded files
    image_paths = []
    for file in files:
        if file.filename == '':
            continue
        filename = str(uuid.uuid4()) + os.path.splitext(file.filename)[1]
        file_path = os.path.join('static/uploads', filename)
        file.save(file_path)
        image_paths.append(file_path)
    
    if len(image_paths) < 2:
        return jsonify({"error": "At least 2 valid images are required"}), 400
    
    try:
        # Load images
        images = []
        for path in image_paths:
            img = cv2.imread(path)
            if img is None:
                return jsonify({"error": f"Could not load image: {path}"}), 400
            images.append(img)
        
        # Use OpenCV's Stitcher
        stitcher = cv2.Stitcher_create()
        status, stitched = stitcher.stitch(images)
        
        if status != cv2.Stitcher_OK:
            error_messages = {
                cv2.Stitcher_ERR_NEED_MORE_IMGS: "Not enough images for stitching",
                cv2.Stitcher_ERR_HOMOGRAPHY_EST_FAIL: "Homography estimation failed",
                cv2.Stitcher_ERR_CAMERA_PARAMS_ADJUST_FAIL: "Camera parameter adjustment failed"
            }
            return jsonify({"error": error_messages.get(status, "Stitching failed")}), 400
        
        # Save result
        result_filename = f"stitched_{uuid.uuid4()}.jpg"
        result_path = os.path.join('static/results', result_filename)
        cv2.imwrite(result_path, stitched)
        
        return jsonify({
            "message": "Images stitched successfully",
            "result_filename": result_filename
        })
    
    except Exception as e:
        return jsonify({"error": f"Error processing images: {str(e)}"}), 500

@app.route('/api/detect-object', methods=['POST'])
def detect_object():
    """Detect if an object appears in a scene using SIFT features"""
    if 'object' not in request.files or 'scene' not in request.files:
        return jsonify({"error": "Missing object or scene image"}), 400
    
    object_file = request.files['object']
    scene_file = request.files['scene']
    
    if object_file.filename == '' or scene_file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    
    # Save uploaded files
    object_filename = str(uuid.uuid4()) + os.path.splitext(object_file.filename)[1]
    scene_filename = str(uuid.uuid4()) + os.path.splitext(scene_file.filename)[1]
    
    object_path = os.path.join('static/uploads', object_filename)
    scene_path = os.path.join('static/uploads', scene_filename)
    
    object_file.save(object_path)
    scene_file.save(scene_path)
    
    try:
        # Load images
        obj_img = cv2.imread(object_path, 0)  # Grayscale
        scene_img = cv2.imread(scene_path, 0)  # Grayscale
        scene_color = cv2.imread(scene_path)   # Color for visualization
        
        if obj_img is None or scene_img is None or scene_color is None:
            return jsonify({"error": "Could not load images"}), 400
        
        # Initialize SIFT detector
        sift = cv2.SIFT_create()
        
        # Find keypoints and descriptors
        kp1, des1 = sift.detectAndCompute(obj_img, None)
        kp2, des2 = sift.detectAndCompute(scene_img, None)
        
        if des1 is None or des2 is None:
            return jsonify({"error": "Could not detect features in images"}), 400
        
        # FLANN matcher
        FLANN_INDEX_KDTREE = 1
        index_params = dict(algorithm=FLANN_INDEX_KDTREE, trees=5)
        search_params = dict(checks=50)
        flann = cv2.FlannBasedMatcher(index_params, search_params)
        
        matches = flann.knnMatch(des1, des2, k=2)
        
        # Apply ratio test
        good_matches = []
        for m, n in matches:
            if m.distance < 0.75 * n.distance:
                good_matches.append(m)
        
        # Check if we have enough good matches
        MIN_MATCH_COUNT = 10
        if len(good_matches) >= MIN_MATCH_COUNT:
            src_pts = np.float32([kp1[m.queryIdx].pt for m in good_matches]).reshape(-1, 1, 2)
            dst_pts = np.float32([kp2[m.trainIdx].pt for m in good_matches]).reshape(-1, 1, 2)
            
            # Find homography
            M, mask = cv2.findHomography(src_pts, dst_pts, cv2.RANSAC, 5.0)
            
            # Get dimensions of object image
            h, w = obj_img.shape
            
            # Define corners of object to be detected
            pts = np.float32([[0, 0], [0, h-1], [w-1, h-1], [w-1, 0]]).reshape(-1, 1, 2)
            
            # Transform corners to scene coordinate system
            dst = cv2.perspectiveTransform(pts, M)
            
            # Draw bounding box
            scene_color = cv2.polylines(scene_color, [np.int32(dst)], True, (0, 255, 0), 3)
            
            # Draw matches visualization
            match_img = cv2.drawMatches(obj_img, kp1, scene_img, kp2, good_matches, None, 
                                         flags=cv2.DrawMatchesFlags_NOT_DRAW_SINGLE_POINTS)
            
            detected = True
            message = f"Object found! {len(good_matches)} good matches."
        else:
            match_img = cv2.drawMatches(obj_img, kp1, scene_img, kp2, good_matches, None, 
                                         flags=cv2.DrawMatchesFlags_NOT_DRAW_SINGLE_POINTS)
            detected = False
            message = f"Not enough matches found - {len(good_matches)}/{MIN_MATCH_COUNT}"
            scene_color = scene_img  # Use original scene for result
        
        # Save result images
        result_filename = f"detection_{uuid.uuid4()}.jpg"
        result_path = os.path.join('static/results', result_filename)
        
        match_filename = f"matches_{uuid.uuid4()}.jpg"
        match_path = os.path.join('static/results', match_filename)
        
        cv2.imwrite(result_path, scene_color)
        cv2.imwrite(match_path, match_img)
        
        return jsonify({
            "message": message,
            "detected": detected,
            "result_filename": result_filename,
            "matches_filename": match_filename,
            "object_filename": object_filename,
            "scene_filename": scene_filename
        })
    
    except Exception as e:
        return jsonify({"error": f"Error processing images: {str(e)}"}), 500

@app.route('/api/recognize-object', methods=['POST'])
def recognize_object():
    """Recognize object from database using SIFT features"""
    if 'query' not in request.files or 'known_objects[]' not in request.files:
        return jsonify({"error": "Missing query image or known objects"}), 400
    
    query_file = request.files['query']
    known_files = request.files.getlist('known_objects[]')
    
    if query_file.filename == '' or len(known_files) == 0:
        return jsonify({"error": "Missing files"}), 400
    
    # Save query image
    query_filename = str(uuid.uuid4()) + os.path.splitext(query_file.filename)[1]
    query_path = os.path.join('static/uploads', query_filename)
    query_file.save(query_path)
    
    # Save known objects
    known_filenames = []
    known_paths = []
    for file in known_files:
        if file.filename == '':
            continue
        filename = str(uuid.uuid4()) + os.path.splitext(file.filename)[1]
        file_path = os.path.join('static/uploads', filename)
        file.save(file_path)
        known_filenames.append(filename)
        known_paths.append(file_path)
    
    try:
        # Load query image
        query_img = cv2.imread(query_path, 0)  # Grayscale
        query_color = cv2.imread(query_path)   # Color for visualization
        
        if query_img is None:
            return jsonify({"error": "Could not load query image"}), 400
        
        # Initialize SIFT detector
        sift = cv2.SIFT_create()
        
        # Get query keypoints and descriptors
        kp_query, des_query = sift.detectAndCompute(query_img, None)
        
        if des_query is None:
            return jsonify({"error": "Could not detect features in query image"}), 400
        
        best_match = None
        best_match_count = 0
        best_match_idx = -1
        
        # FLANN matcher
        FLANN_INDEX_KDTREE = 1
        index_params = dict(algorithm=FLANN_INDEX_KDTREE, trees=5)
        search_params = dict(checks=50)
        flann = cv2.FlannBasedMatcher(index_params, search_params)
        
        # Check each known object
        for i, known_path in enumerate(known_paths):
            known_img = cv2.imread(known_path, 0)  # Grayscale
            
            if known_img is None:
                continue
            
            # Get keypoints and descriptors for known object
            kp_known, des_known = sift.detectAndCompute(known_img, None)
            
            if des_known is None:
                continue
            
            # Match descriptors
            matches = flann.knnMatch(des_query, des_known, k=2)
            
            # Apply ratio test
            good_matches = []
            for m, n in matches:
                if m.distance < 0.75 * n.distance:
                    good_matches.append(m)
            
            # If this known object has more good matches, it's a better match
            if len(good_matches) > best_match_count:
                best_match_count = len(good_matches)
                best_match = good_matches
                best_match_idx = i
        
        # Check if we found any good matches
        if best_match_count > 10:
            # Get the best matching known image
            best_known_path = known_paths[best_match_idx]
            best_known_filename = known_filenames[best_match_idx]
            best_known_img = cv2.imread(best_known_path, 0)
            
            # Draw matches visualization
            kp_best_known, _ = sift.detectAndCompute(best_known_img, None)
            match_img = cv2.drawMatches(query_img, kp_query, best_known_img, kp_best_known, 
                                         best_match, None, flags=cv2.DrawMatchesFlags_NOT_DRAW_SINGLE_POINTS)
            
            # Save match visualization
            match_filename = f"recognition_{uuid.uuid4()}.jpg"
            match_path = os.path.join('static/results', match_filename)
            cv2.imwrite(match_path, match_img)
            
            return jsonify({
                "message": f"Object recognized! {best_match_count} good matches.",
                "recognized": True,
                "matches_filename": match_filename,
                "query_filename": query_filename,
                "matching_object_filename": best_known_filename
            })
        else:
            return jsonify({
                "message": "Object not recognized.",
                "recognized": False,
                "query_filename": query_filename
            })
    
    except Exception as e:
        return jsonify({"error": f"Error processing images: {str(e)}"}), 500

@app.route('/api/track-object', methods=['POST'])
def track_object():
    """Simulate object tracking in video using SIFT features"""
    # In a real implementation, this would process a video file
    # For this demo, we'll simulate tracking with a sequence of processing steps
    
    if 'video' not in request.files:
        return jsonify({"error": "No video file provided"}), 400
    
    video_file = request.files['video']
    
    if video_file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    
    # Save the video file
    video_filename = str(uuid.uuid4()) + os.path.splitext(video_file.filename)[1]
    video_path = os.path.join('static/uploads', video_filename)
    video_file.save(video_path)
    
    try:
        # Open the video file
        cap = cv2.VideoCapture(video_path)
        
        if not cap.isOpened():
            return jsonify({"error": "Could not open video file"}), 400
        
        # Get video properties
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = cap.get(cv2.CAP_PROP_FPS)
        
        # Create output video writer
        output_filename = f"tracked_{uuid.uuid4()}.mp4"
        output_path = os.path.join('static/results', output_filename)
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
        
        # Read first frame and select object
        ret, first_frame = cap.read()
        if not ret:
            return jsonify({"error": "Could not read first frame"}), 400
        
        # For demo purposes, we'll track something in the center of the frame
        # A real implementation would let the user select the object
        x, y, w, h = width//4, height//4, width//2, height//2
        track_window = (x, y, w, h)
        
        # Set up the ROI for tracking
        roi = first_frame[y:y+h, x:x+w]
        hsv_roi = cv2.cvtColor(roi, cv2.COLOR_BGR2HSV)
        
        # Use a simple histogram-based tracker for demo
        roi_hist = cv2.calcHist([hsv_roi], [0], None, [180], [0, 180])
        cv2.normalize(roi_hist, roi_hist, 0, 255, cv2.NORM_MINMAX)
        
        # Setup the termination criteria
        term_criteria = (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 10, 1)
        
        # Draw the initial tracking window
        tracking_result = first_frame.copy()
        cv2.rectangle(tracking_result, (x, y), (x+w, y+h), (0, 255, 0), 2)
        out.write(tracking_result)
        
        # Process a limited number of frames for the demo
        max_frames = min(100, int(cap.get(cv2.CAP_PROP_FRAME_COUNT)))
        
        for _ in range(max_frames - 1):
            ret, frame = cap.read()
            if not ret:
                break
                
            hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
            dst = cv2.calcBackProject([hsv], [0], roi_hist, [0, 180], 1)
            
            # Apply camshift
            ret, track_window = cv2.CamShift(dst, track_window, term_criteria)
            
            # Draw tracking result
            pts = cv2.boxPoints(ret).astype(int)
            tracking_result = cv2.polylines(frame.copy(), [pts], True, (0, 255, 0), 2)
            
            out.write(tracking_result)
        
        # Release resources
        cap.release()
        out.release()
        
        # Save a thumbnail from the tracked video
        thumbnail_filename = f"thumbnail_{uuid.uuid4()}.jpg"
        thumbnail_path = os.path.join('static/results', thumbnail_filename)
        
        # Re-open video to get a frame for the thumbnail
        cap = cv2.VideoCapture(output_path)
        cap.set(cv2.CAP_PROP_POS_FRAMES, max_frames // 2)  # Get a frame from the middle
        ret, thumb_frame = cap.read()
        if ret:
            cv2.imwrite(thumbnail_path, thumb_frame)
        cap.release()
        
        return jsonify({
            "message": "Video processed successfully",
            "video_filename": output_filename,
            "thumbnail_filename": thumbnail_filename
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
