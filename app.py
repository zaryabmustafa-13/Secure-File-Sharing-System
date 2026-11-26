import uuid
import re
import io

from flask import Flask, render_template, request, jsonify, send_file

from s3_service import (
    upload_encrypted_file,
    download_encrypted_file,
    generate_upload_url,
    generate_download_url
)

app = Flask(__name__)


@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/upload-url", methods=["POST"])
def upload_url():
    data = request.get_json(silent=True) or {}
    filename = data.get("filename", "")

    if not filename or len(filename) > 200:
        return jsonify({"error": "Invalid filename"}), 400

    object_key = f"encrypted/{uuid.uuid4().hex}.enc"

    try:
        url = generate_upload_url(object_key)

        return jsonify({
            "upload_url": url,
            "object_key": object_key,
            "expires_in": 300
        })

    except Exception:
        app.logger.exception("Upload URL generation failed")
        return jsonify({"error": "Could not generate upload URL"}), 500


@app.route("/api/download-url", methods=["POST"])
def download_url():
    data = request.get_json(silent=True) or {}
    object_key = data.get("object_key", "")

    if not re.fullmatch(r"encrypted/[a-f0-9]{32}\.enc", object_key):
        return jsonify({"error": "Invalid file reference"}), 400

    try:
        url = generate_download_url(object_key)

        return jsonify({
            "download_url": url,
            "expires_in": 300
        })

    except Exception:
        app.logger.exception("Download URL generation failed")
        return jsonify({"error": "Could not generate download URL"}), 500
# Upload encrypted file to AWS S3 through Flask
@app.route("/api/upload", methods=["POST"])
def upload():
    file = request.files.get("file")

    if not file:
        return jsonify({"error": "No file received"}), 400

    object_key = f"encrypted/{uuid.uuid4().hex}.enc"

    try:
        upload_encrypted_file(file, object_key)

        return jsonify({
            "message": "File uploaded successfully",
            "object_key": object_key
        }), 200

    except Exception:
        app.logger.exception("File upload failed")
        return jsonify({"error": "S3 upload failed"}), 500


# Download encrypted file from AWS S3 through Flask
@app.route("/api/download", methods=["POST"])
def download():
    data = request.get_json(silent=True) or {}
    object_key = data.get("object_key", "")

    if not re.fullmatch(r"encrypted/[a-f0-9]{32}\.enc", object_key):
        return jsonify({"error": "Invalid file reference"}), 400

    try:
        encrypted_data = download_encrypted_file(object_key)

        return send_file(
            io.BytesIO(encrypted_data),
            mimetype="application/octet-stream",
            as_attachment=True,
            download_name="encrypted_file.bin"
        )

    except Exception:
        app.logger.exception("File download failed")
        return jsonify({"error": "File download failed"}), 500


if __name__ == "__main__":
    app.run(debug=True)
