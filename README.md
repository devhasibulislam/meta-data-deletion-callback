# Meta Data Deletion API Documentation

This document explains the API endpoints for creating, deleting, and confirming the deletion of user data, particularly for handling Facebook user data. Each endpoint includes an example request and response for better understanding.

---

## 1\. Create User Data

**Endpoint:**  
`POST http://localhost:3000/create-data`

**Description:**  
This endpoint is used to create and store user data.

**Request Body:**

``` json
{
    "name": "Hasibul Islam",
    "email": "devhasibulislam@gmail.com",
    "facebookUserId": "626540476374201"
}

 ```

**Example cURL Command:**

``` bash
curl --location 'http://localhost:3000/create-data' \
--data-raw '{
    "name": "Hasibul Islam",
    "email": "devhasibulislam@gmail.com",
    "facebookUserId": "626540476374201"
}'

 ```

**Response:**

``` json
{
    "signed_request": "TAFAkvQvYwMHGLgST2uhcW7NqM7A4YxEGIjDLctxtIU=.eyJuYW1lIjoiSGFzaWJ1bCBJc2xhbSIsImVtYWlsIjoiZGV2aGFzaWJ1bGlzbGFtQGdtYWlsLmNvbSIsImZhY2Vib29rVXNlcklkIjoiNjI2NTQwNDc2Mzc0MjAxIn0="
}

 ```

---

## 2\. Delete User Data

**Endpoint:**  
`POST http://localhost:3000/data-deletion`

**Description:**  
This endpoint deletes the user's data using the signed request received during the data creation step.

**Request Body:**

``` json
{
    "signed_request": "TAFAkvQvYwMHGLgST2uhcW7NqM7A4YxEGIjDLctxtIU=.eyJuYW1lIjoiSGFzaWJ1bCBJc2xhbSIsImVtYWlsIjoiZGV2aGFzaWJ1bGlzbGFtQGdtYWlsLmNvbSIsImZhY2Vib29rVXNlcklkIjoiNjI2NTQwNDc2Mzc0MjAxIn0="
}

 ```

**Example cURL Command:**

``` bash
curl --location 'http://localhost:3000/data-deletion' \
--data '{
    "signed_request": "TAFAkvQvYwMHGLgST2uhcW7NqM7A4YxEGIjDLctxtIU=.eyJuYW1lIjoiSGFzaWJ1bCBJc2xhbSIsImVtYWlsIjoiZGV2aGFzaWJ1bGlzbGFtQGdtYWlsLmNvbSIsImZhY2Vib29rVXNlcklkIjoiNjI2NTQwNDc2Mzc0MjAxIn0="
}'

 ```

**Response:**

``` json
{
    "url": "http://localhost:3000/deletion-status?code=delete_626540476374201_1735454772170",
    "confirmation_code": "delete_626540476374201_1735454772170"
}

 ```

---

## 3\. Confirm User Deletion

**Endpoint:**  
`GET http://localhost:3000/deletion-status?code=`

**Description:**  
This endpoint confirms whether the user data deletion process was successful.

**Query Parameters:**

- `code`: The confirmation code received in the response of the "Delete User Data" endpoint. Example: `delete_626540476374201_1735454772170`
    

**Example cURL Command:**

``` bash
curl --location 'http://localhost:3000/deletion-status?code=delete_626540476374201_1735454772170'

 ```

**Response:**

``` json
{
    "facebookUserId": "626540476374201",
    "status": "Deleted"
}

 ```

---

## Notes

1. Always store the `signed_request` securely as it is required for the deletion process.
    
2. Use the confirmation code provided in the response of the data deletion step to verify the deletion status.
    
3. Ensure the endpoints are accessible and properly secured during implementation.