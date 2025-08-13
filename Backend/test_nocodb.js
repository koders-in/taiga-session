// A simple Node.js script to interact with the NocoDB REST API.
// This script uses the 'axios' library.

import axios from 'axios';

// Configuration
const BASE_URL = 'http://localhost:8080';
const TABLE_ID = 'mo90o7onz2d8oh1';
const API_TOKEN = 'QEHwKlBURkmRZ2oTTBgoNSLJg3Yn1bSXDXc3vPzY';

const headers = {
  'accept': 'application/json',
  'Content-Type': 'application/json',
  'xc-token': API_TOKEN
};

// Table fields (from your curl example)
const FIELDS = {
  NAME: 'Name',
  USER_ID: 'user_id',
  EMAIL: 'Email'
};

// Simple debug function to make API requests
async function debugApiCall() {
  const url = `${BASE_URL}/api/v2/tables/${TABLE_ID}/columns`;
  console.log(`\nChecking table structure at: ${url}`);
  
  try {
    const response = await axios.get(url, { 
      headers: headers,
      validateStatus: () => true 
    });
    
    if (response.data && response.data.list) {
      console.log('\n=== TABLE COLUMNS ===');
      response.data.list.forEach((col, index) => {
        console.log(`\nColumn ${index + 1}:`);
        console.log('Name:', col.column_name || 'N/A');
        console.log('Title:', col.title || 'N/A');
        console.log('Type:', col.uidt || 'N/A');
        console.log('Required:', col.rqd || false);
      });
    }
    
  } catch (error) {
    console.error('\nError checking table structure:', error.message);
  }
}

/**
 * Saves a new record to the NocoDB table.
 * @param {object} recordData - The data for the new record.
 */
async function saveRecord(recordData) {
  console.log('\n--- Attempting to save a new record ---');
  console.log('Sending data:', JSON.stringify(recordData, null, 2));
  console.log('To URL:', `${API_BASE_URL}/records`);
  
  try {
    const response = await axios.post(
      `${API_BASE_URL}/records`,
      recordData,
      { 
        headers: headers,
        validateStatus: function (status) {
          return status < 500; // Resolve only if status code is less than 500
        }
      }
    );
    
    console.log('✅ Record saved successfully!');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('❌ Error saving record:');
    if (error.response) {
      // The request was made and the server responded with a status code
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      console.error('Headers:', error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received. Request:', error.request);
    } else {
      // Something happened in setting up the request
      console.error('Error:', error.message);
    }
    throw error;
  }
}

// Function to create a new record
async function createRecord(data) {
  const url = `${BASE_URL}/api/v2/tables/${TABLE_ID}/records`;
  console.log('\nCreating new record...');
  
  try {
    const response = await axios.post(url, data, { headers });
    console.log('✅ Record created successfully!');
    console.log('Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error creating record:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
    throw error;
  }
}

// Function to list all records
async function listRecords() {
  const url = `${BASE_URL}/api/v2/tables/${TABLE_ID}/records`;
  console.log('\nFetching records...');
  
  try {
    const response = await axios.get(url, { headers });
    console.log('✅ Records retrieved successfully!');
    console.log('Total records:', response.data.list ? response.data.list.length : 0);
    return response.data.list || [];
  } catch (error) {
    console.error('❌ Error fetching records:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
    return [];
  }
}

/**
 * Reads all records from the NocoDB table.
 */
async function readRecords() {
  console.log('\n--- Attempting to read all records ---');
  console.log('Requesting from URL:', `${API_BASE_URL}/records`);
  
  try {
    const response = await axios.get(
      `${API_BASE_URL}/records`,
      { 
        headers: headers,
        validateStatus: function (status) {
          return status < 500; // Resolve only if status code is less than 500
        }
      }
    );
    
    console.log('✅ Records retrieved successfully!');
    console.log('Status:', response.status);
    console.log('Total records:', response.data.list ? response.data.list.length : 0);
    console.log('Records:', JSON.stringify(response.data.list, null, 2));
    return response.data.list;
  } catch (error) {
    console.error('❌ Error reading records:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      console.error('Headers:', error.response.headers);
    } else if (error.request) {
      console.error('No response received. Request:', error.request);
    } else {
      console.error('Error:', error.message);
    }
    throw error;
  }
}

// Main function
async function main() {
  console.log('Starting NocoDB script...');
  console.log('Base URL:', BASE_URL);
  console.log('Table ID:', TABLE_ID);
  
  try {
    // First, list existing records
    const existingRecords = await listRecords();
    
    // Create a new record
    const newRecord = {
      [FIELDS.NAME]: 'John Doe',
      [FIELDS.EMAIL]: 'john.doe@example.com',
      [FIELDS.USER_ID]: '2'  // Make sure this is unique
    };
    
    console.log('\n=== CREATING NEW RECORD ===');
    console.log('Record data:', JSON.stringify(newRecord, null, 2));
    await createRecord(newRecord);
    
    // List records again to confirm
    console.log('\n=== UPDATED RECORDS ===');
    const updatedRecords = await listRecords();
    
    console.log('\n=== OPERATION COMPLETED ===');
    console.log(`Total records: ${updatedRecords.length}`);
    
  } catch (error) {
    console.error('\n❌ Script failed with error:', error.message);
    process.exit(1);
  }
}

// Execute the main function
main();
