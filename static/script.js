const uploadFile = document.getElementById("uploadFile");
const uploadPassword = document.getElementById("uploadPassword");
const uploadButton = document.getElementById("uploadButton");
const uploadResult = document.getElementById("uploadResult");

const objectKeyInput = document.getElementById("objectKey");
const downloadPassword = document.getElementById("downloadPassword");
const downloadFilename = document.getElementById("downloadFilename");
const downloadButton = document.getElementById("downloadButton");
const downloadResult = document.getElementById("downloadResult");

const ITERATIONS = 310000;

async function deriveKey(password, salt) {
    const encoder = new TextEncoder();

    const passwordKey = await crypto.subtle.importKey(
        "raw",
        encoder.encode(password),
        "PBKDF2",
        false,
        ["deriveKey"]
    );

    return crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: ITERATIONS,
            hash: "SHA-256"
        },
        passwordKey,
        {
            name: "AES-GCM",
            length: 256
        },
        false,
        ["encrypt", "decrypt"]
    );
}

async function encryptFile(file, password) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const key = await deriveKey(password, salt);
    const fileData = await file.arrayBuffer();

    const encrypted = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        key,
        fileData
    );

    const combined = new Uint8Array(
        salt.length + iv.length + encrypted.byteLength
    );

    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encrypted), salt.length + iv.length);

    return new Blob([combined], {
        type: "application/octet-stream"
    });
}

async function decryptFile(encryptedBlob, password) {
    const data = new Uint8Array(await encryptedBlob.arrayBuffer());

    if (data.length < 45) {
        throw new Error("Encrypted file is invalid or incomplete.");
    }

    const salt = data.slice(0, 16);
    const iv = data.slice(16, 28);
    const encryptedData = data.slice(28);

    const key = await deriveKey(password, salt);

    return crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv },
        key,
        encryptedData
    );
}

// UPLOAD
uploadButton.addEventListener("click", async () => {
    const file = uploadFile.files[0];
    const password = uploadPassword.value;

    if (!file || !password) {
        uploadResult.textContent = "Select a file and enter a password.";
        return;
    }

    uploadButton.disabled = true;
    uploadResult.textContent = "Encrypting and uploading...";

    try {
        const encryptedBlob = await encryptFile(file, password);

        const formData = new FormData();
        formData.append("file", encryptedBlob, "encrypted_file.bin");

        const response = await fetch("/api/upload", {
            method: "POST",
            body: formData
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Upload failed.");
        }

        objectKeyInput.value = result.object_key;

        uploadResult.textContent =
            "Upload successful! Save this file reference: " +
            result.object_key;

    } catch (error) {
        console.error("Upload error:", error);
        uploadResult.textContent = "Upload failed: " + error.message;
    } finally {
        uploadButton.disabled = false;
    }
});

// DOWNLOAD
downloadButton.addEventListener("click", async () => {
    const objectKey = objectKeyInput.value.trim();
    const password = downloadPassword.value;
    const filename = downloadFilename.value.trim() || "decrypted_file";

    if (!objectKey || !password) {
        downloadResult.textContent =
            "Enter the file reference and password.";
        return;
    }

    downloadButton.disabled = true;
    downloadResult.textContent = "Downloading and decrypting...";

    try {
        const response = await fetch("/api/download", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ object_key: objectKey })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Download failed.");
        }

        const encryptedBlob = await response.blob();
        const decryptedData = await decryptFile(encryptedBlob, password);

        const downloadBlob = new Blob([decryptedData]);
        const url = URL.createObjectURL(downloadBlob);

        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(url);

        downloadResult.textContent =
            "File downloaded and decrypted successfully.";

    } catch (error) {
        console.error("Download error:", error);
        downloadResult.textContent =
            "Download failed. Check your password or file reference.";
    } finally {
        downloadButton.disabled = false;
    }
});