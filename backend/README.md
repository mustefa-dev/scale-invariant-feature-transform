
# Flask Backend for Computer Vision Applications

This backend provides API endpoints for processing images with OpenCV and the SIFT algorithm.

## Setup

1. Create a Python virtual environment:
   ```
   python -m venv venv
   ```

2. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - Mac/Linux: `source venv/bin/activate`

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Run the Flask application:
   ```
   python app.py
   ```

The backend will run on http://localhost:5000

## API Endpoints

### Health Check
- `GET /api/health`: Check if the backend is running

### Image Processing
- `POST /api/upload`: Generic file upload endpoint
- `POST /api/stitch-images`: Stitch multiple images to create a panorama
- `POST /api/detect-object`: Detect if an object appears in a scene
- `POST /api/recognize-object`: Recognize an object from a database of known objects
- `POST /api/track-object`: Track objects in video using SIFT features

## Production Deployment

For production deployment, consider:

1. Using a production WSGI server like Gunicorn:
   ```
   pip install gunicorn
   gunicorn -b 0.0.0.0:5000 app:app
   ```

2. Set up a proper file storage solution instead of using local directories

3. Add proper error handling, logging, and security measures

4. Consider containerizing the application with Docker for easier deployment
