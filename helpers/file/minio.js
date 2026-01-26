const Minio = require("minio");
const fs = require("fs");
const path = require("path");
const { MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRETKEY, MINIO_BUCKET, MINIO_PORT } = require("../env/envConfig");

class MinioHelperClient {
	constructor() {
		this.minio = new Minio.Client({
			endPoint: MINIO_ENDPOINT,
			port: 9000,
			useSSL: false,
			accessKey: MINIO_ACCESS_KEY,
			secretKey: MINIO_SECRETKEY,
		});
		this.bucketName = MINIO_BUCKET;
	}
	async bucketExists() {
		this.minio.bucketExists(this.bucketName, (err, exists) => {
			if (err) {
				return console.log("Error checking bucket existence:", err);
			}

			if (!exists) {
				this.minio.makeBucket(this.bucketName, "us-east-1", async (err) => {
					if (err) {
						return console.log("Error creating bucket:", err);
					}
					console.log(`Bucket ${this.bucketName} created successfully.`);
					// await this.uploadFile();
				});
			} else {
				console.log(`Bucket ${this.bucketName} already exists.`);
				//   uploadFile();
			}
		});
	}
	async presignedGetObject(fileName) {
		// Generate a presigned URL
		const expires = 100 * 365 * 24 * 60 * 60; // 100 year url
		this.minio.presignedGetObject(this.bucketName, fileName, expires, (err, url) => {
			if (err) {
				return console.log("Error generating presigned URL:", err);
			}
			console.log("Presigned URL:", url);
			return url;
		});
	}
	async uploadFile(fileName, filePath, data) {
		return new Promise((resolve, reject) => {
			this.minio.putObject(this.bucketName, `${filePath}/${fileName}`, data, async (err, etag) => {
				if (err) {
					console.log("Error uploading data:", err);
					reject(err);
				}
				const url = `http://${MINIO_ENDPOINT}:${MINIO_PORT}/${this.bucketName}/${filePath}/${fileName}`;
				resolve({ etag, url, path: `${filePath}/${fileName}`, bucket: this.bucketName, filename: fileName });
			});
		});
	}
	async setBucketPolicy() {
		const policy = {
			Version: "2012-10-17",
			Statement: [
				{
					Effect: "Allow",
					Principal: "*",
					Action: ["s3:GetObject"],
					Resource: [`arn:aws:s3:::${this.bucketName}/*`],
				},
			],
		};

		// Set the bucket policy
		this.minio.setBucketPolicy(this.bucketName, JSON.stringify(policy), (err) => {
			if (err) {
				return console.log("Error setting bucket policy:", err);
			}
			console.log("Bucket policy set successfully.");
		});
	}
	async checkFileDeletion(bucketName, objectName) {
		return new Promise((resolve, reject) => {
			// prettier-ignore
			this.minio.statObject(bucketName, objectName, (err, stat) => { // eslint-disable-line
				if (err) {
					if (err.code === "NoSuchKey") {
						// File not found, hence deletion is successful
						resolve(true);
					} else {
						// Some other error occurred
						reject(err);
					}
				} else {
					// File still exists
					resolve(false);
				}
			});
		});
	}
	async removeFile(filepath) {
		try {
			// console.log({folderPath, fileName});
			const objectName = `${filepath}`; // Construct the full object name
			let test = await this.minio.removeObject(this.bucketName, objectName, (err) => {
				console.log(err);
				if (err) {
					return console.log("Error deleting file:", err);
				}
				console.log(`http://${MINIO_ENDPOINT}:${MINIO_PORT}/${this.bucketName}/${objectName}`);
				return `File ${objectName} deleted successfully.`;
			});
			console.log({ test });

			// Verify if the file is actually deleted
			// const isDeleted = await this.checkFileDeletion(this.bucketName, objectName);
			// if (isDeleted) {
			// console.log(`Verification: File ${objectName} is no longer in the bucket.`);
			// } else {
			// console.log(`Verification: File ${objectName} is still present in the bucket.`);
			// }
		} catch (error) {
			console.log(error);
			throw new Error(error);
		}
	}

	async getFile(filePath) {
		return new Promise((resolve, reject) => {
			this.minio.getObject(this.bucketName, filePath, (err, dataStream) => {
				console.log({ dataStream });
				if (err) {
					if (err.code === "NoSuchKey") {
						// File not found, hence deletion is successful
						reject({ status: 404, message: `File ${filePath} not found` });
					} else {
						// Some other error occurred
						reject(err);
					}
				}
				resolve(dataStream);
			});
		});
	}

	//Migration - not used
	async moveFileToMinio(localFilePath, fileName) {
		const objectName = `${fileName}`; // Construct the full object name
		try {
			// Upload the file to MinIO
			await this.minio.fPutObject(this.bucketName, objectName, localFilePath);
			const url = `http://${MINIO_ENDPOINT}:9000/${this.bucketName}/${fileName}`;
			console.log({ url, path: fileName, bucket: this.bucketName });
			// Delete the local file after successful upload
			//   fs.unlink(localFilePath, (err) => {
			//     if (err) {
			//       console.error('Error deleting local file:', err);
			//     } else {
			//       console.log(`File ${localFilePath} moved to MinIO successfully.`);
			//     }
			//   });
		} catch (err) {
			console.error("Error uploading file to MinIO:", err);
		}
	}

	//Migration - not used
	async uploadDirectoryFiles(directoryPath, basePath = "") {
		const files = fs.readdirSync(directoryPath);
		const bucketName = this.bucketName;

		for (const file of files) {
			let filePath = path.join(directoryPath, file);
			const stat = fs.statSync(filePath);

			if (stat.isDirectory()) {
				await this.uploadDirectoryFiles(filePath, bucketName, path.join(basePath, file));
			} else {
				const objectName = path.join(basePath, file); // eslint-disable-line
				try {
					filePath = filePath.replace(/[\\]/gim, "/");
					// console.log({filePath, bucketName, objectName, file, directoryPath});
					const etag = await this.moveFileToMinio("./" + filePath, filePath); // eslint-disable-line
					// console.log(`File ${filePath} uploaded successfully as ${objectName}. ETag:`);
				} catch (err) {
					console.error(`Error uploading file ${filePath}:`, err);
				}
			}
		}
	}
}

// Example usage
const client = new MinioHelperClient();
(async () => {
	await client.setBucketPolicy();
	console.log("Bucket Policy Change");
})();

module.exports = client;
