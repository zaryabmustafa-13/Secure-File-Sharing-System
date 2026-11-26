# Secure File Sharing System
A secure file-sharing web application built with Flask and AWS S3. It protects files using client-side encryption before upload and supports temporary AWS S3 presigned download links for controlled file access.

## Features
- **End-to-End Encryption:** Files are encrypted in the browser using AES-256-GCM before being uploaded.
- **Password-Based Key Derivation:** PBKDF2 with SHA-256 and 310,000 iterations derives the encryption key.
- **Secure File Storage:** Encrypted files are stored in an AWS S3 bucket.
- **Secure File Download:** Encrypted files can be downloaded and decrypted in the browser using the correct password.
- **Temporary Signed URLs:** AWS S3 presigned download URLs provide temporary access and expire after 5 minutes.
- **Input Validation:** File references are validated before download requests.
- **Wrong Password Protection:** Incorrect passwords cannot decrypt the original file.

## Technologies Used

| Technology | Purpose |
|---|---|
| Python | Backend development |
| Flask | Web application and API routes |
| JavaScript | Client-side encryption and decryption |
| HTML5 | Application interface |
| CSS3 | User interface styling |
| Web Crypto API | AES-256-GCM and PBKDF2 |
| AWS S3 | Cloud file storage |
| Boto3 | AWS S3 integration |
| python-dotenv | Environment configuration |

## Project Structure
Secure_File_Sharing_System/
│
├── app.py
├── s3_service.py
├── requirements.txt
├── .env
│
├── templates/
│   └── index.html
│
├── static/
│   ├── script.js
│   └── style.css
│
├── uploads


## How It Works
1. The user selects a file and enters an encryption password.
2. JavaScript generates a random salt and initialization vector.
3. PBKDF2 derives an encryption key from the password.
4. AES-256-GCM encrypts the file in the browser.
5. The encrypted data is uploaded to AWS S3.
6. During download, the encrypted file is retrieved from storage.
7. The user enters the password to decrypt the file in the browser.
8. The original file is recovered only when the correct password is supplied.

### Encryption Configuration
- Algorithm: AES-256-GCM
- Key derivation: PBKDF2
- Hash function: SHA-256
- PBKDF2 iterations: 310,000
- Salt: 16 random bytes
- Initialization Vector (IV): 12 random bytes

## Installation and Setup
### 1. Create a Virtual Environment
python -m venv .venv

Activate it on Windows:
powershell
.venv\Scripts\Activate.ps1

### 2. Install Dependencies
pip install -r requirements.txt

### 3. Configure AWS Credentials
Create a '.env' file in the project root:

env
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=ap-southeast-2
S3_BUCKET_NAME=your_bucket_name

Use an IAM user with only the required S3 permissions. Never upload your `.env` file or AWS credentials to GitHub.

### 4. Run the Application
python app.py

Open the application at:
http://127.0.0.1:5000


## API Endpoints
| Endpoint | Method | Purpose |
|---|---|---|
| '/' | GET | Application homepage |
| '/api/upload' | POST | Upload encrypted file |
| '/api/download' | POST | Retrieve encrypted file |
| '/api/upload-url' | POST | Generate temporary upload URL |
| '/api/download-url' | POST | Generate temporary download URL |

Presigned URLs expire after 300 seconds.

## Testing and Verification
The following tests were performed:

- Successful encrypted file upload to AWS S3.
- Successful encrypted file download.
- Successful decryption using the correct password.
- Failed decryption using an incorrect password.
- Invalid file-reference validation.
- Successful generation of a temporary S3 download URL.
- Successful retrieval of encrypted file data through the signed URL.

## Security Notes
- Files are encrypted in the browser before upload.
- AWS S3 stores encrypted file data rather than the original plaintext file.
- Encryption passwords should be shared separately through a secure channel.
- Presigned URLs provide temporary access and should be treated as confidential.
- AWS credentials must remain private and should never be committed to source control.
- This project is an internship prototype and requires additional security hardening before production deployment.

## Project Objective
The objective of this project is to develop a secure file-sharing platform that protects sensitive documents through client-side encryption and cloud-based storage, while demonstrating secure file transfer using AWS S3.
