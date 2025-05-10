
# Flask Backend for Computer Vision Applications

This backend provides API endpoints for processing images with OpenCV and the SIFT algorithm.

## Development Setup

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

4. Create a `.env` file from the example:
   ```
   cp .env.example .env
   ```
   
5. Run the Flask application for development:
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

### Option 1: Traditional Server

1. Set up a server with Python installed
2. Clone this repository to the server
3. Create a virtual environment and install dependencies
4. Set up environment variables in `.env` file:
   ```
   PORT=5000
   HOST=0.0.0.0
   DEBUG=False
   CORS_ORIGIN=https://your-frontend-domain.com
   ```
5. Run with Gunicorn:
   ```
   gunicorn -b 0.0.0.0:5000 wsgi:app
   ```
6. Set up a reverse proxy with Nginx or similar

### Option 2: Docker Deployment

1. Build Docker image:
   ```
   docker build -t cv-sift-api .
   ```
2. Run container:
   ```
   docker run -p 5000:5000 -e CORS_ORIGIN=https://your-frontend-domain.com cv-sift-api
   ```

### Option 3: Platform as a Service (PaaS)

Deploy to platforms like Heroku, Google Cloud Run, or AWS Elastic Beanstalk using the included `Procfile`.

## Important Production Considerations

1. Set up proper logging and monitoring
2. Implement rate limiting for API endpoints
3. Configure proper storage solution instead of local file system
4. Set up SSL/TLS for secure communication
5. Add authentication if needed
