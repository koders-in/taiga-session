# NocoDB Setup and Usage Guide

## Initial Setup

1. **Create a new NocoDB project**:
   ```bash
   npx create-nocodb-app
   ```

2. **During installation, select**:
   - Database: SQLite3
   - Project Type: Node.js
   - Execute the given commands when prompted

3. **Start the NocoDB server**:
   ```bash
   npm start
   ```

4. **Access the Web UI**:
   Open your browser and go to:
   ```
   http://localhost:8080/
   ```

5. **First-time Sign Up**:
   - Create an account with your email and password
   - Save these credentials securely

## Getting Started

1. **Create a New Project**
   - After logging in, click on "New Project"
   - Name your project and click "Create"

2. **Create a Table**
   - In your project, click "+ Table"
   - Enter a name for your table
   - Click "Create"

3. **Add Columns**
   - Click "+ Add Column"
   - Select column type (Text, Number, Date, etc.)
   - Configure column settings as needed
   - Click "Save"
   - Repeat for all required columns

4. **Add Data**
   - Click the "+" button to add a new row
   - Enter data in each cell
   - Press Enter or click outside the cell to save

## Default Login Credentials

For pre-built version (our version), use:
- **Email:** user@gmail.com
- **Password:** user@123

## Running the Application

To start the NocoDB server:
```bash
npm start <----------------------------------------------------------- @here guys
```

## API Access

Interact with your NocoDB tables programmatically using the REST API:
```
http://localhost:8080/api/v2/tables/{table_id}/records
```

## Troubleshooting

- Ensure port 8080 is available
- Check Node.js and npm versions if installation fails
- Clear browser cache if UI doesn't load properly

## Documentation

For more information, visit the [official NocoDB documentation](https://docs.nocodb.com/).