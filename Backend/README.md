# Taiga Timer Backend

A backend service that integrates with Taiga.io to manage projects and tasks. This service provides authentication and API endpoints to interact with Taiga's API.

## Features

- User authentication with Taiga
- Fetch user's projects
- Fetch tasks for a specific project
- Secure API endpoints with JWT authentication
- Error handling and request validation

## Tech Stack

- Node.js
- Express.js
- Axios for HTTP requests
- Environment-based configuration

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)
- Taiga.io account

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd taigatimerBackend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and add your configuration:
   ```env
   # Taiga API Configuration
   TAIGA_API_URL=https://taiga.koders.in/api/v1
   
   # Server Configuration
   PORT=4000
   NODE_ENV=development
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

   The server will start on `http://localhost:4000`

## API Endpoints

### Authentication

#### Login
- **URL**: `/api/auth/login`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "username": "your_taiga_username",
    "password": "your_taiga_password"
  }
  ```
- **Success Response**:
  ```json
  {
    "success": true,
    "message": "Login successful",
    "user": {
      "id": 123,
      "username": "your_username",
      "full_name": "Your Name",
      "photo": "path/to/photo.jpg"
    },
    "token": "your_auth_token_here",
    "refreshToken": "your_refresh_token_here"
  }
  ```

### Projects

#### Get User Projects
- **URL**: `/api/taiga/projects`
- **Method**: `GET`
- **Headers**:
  ```
  Authorization: Bearer <your_auth_token>
  ```
- **Success Response**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 123,
        "name": "Project Name",
        "slug": "project-name",
        "description": "Project description",
        "logo_small_url": "https://..."
      }
    ]
  }
  ```

### Tasks

#### Get Project Tasks
- **URL**: `/api/taiga/projects/:projectId/tasks`
- **Method**: `GET`
- **Headers**:
  ```
  Authorization: Bearer <your_auth_token>
  ```
- **URL Parameters**:
  - `projectId`: ID of the project
- **Success Response**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 456,
        "ref": "T-123",
        "subject": "Task title",
        "description": "Task description",
        "status": "In Progress",
        "status_color": "#ff9800",
        "assigned_to": "User Name",
        "created_date": "2023-01-01T00:00:00Z",
        "modified_date": "2023-01-02T00:00:00Z",
        "is_closed": false
      }
    ]
  }
  ```

## Error Handling

All error responses follow this format:

```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error information (in development)"
}
```

### Common HTTP Status Codes

- `200`: Success
- `400`: Bad Request - Invalid request format
- `401`: Unauthorized - Authentication required or invalid token
- `404`: Not Found - Resource not found
- `500`: Internal Server Error - Something went wrong on the server

## Development

### Available Scripts

- `npm run dev`: Start development server with hot-reload
- `npm start`: Start production server

### Environment Variables

- `PORT`: Server port (default: 4000)
- `TAIGA_API_URL`: Taiga API base URL (default: https://taiga.koders.in/api/v1)
- `NODE_ENV`: Environment (development/production)

## License

This project is licensed under the MIT License.
