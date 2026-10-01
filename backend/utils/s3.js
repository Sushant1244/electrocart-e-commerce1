const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');

// Initialize S3 client only if AWS credentials are provided
const s3Client = (() => {
  const region = process.env.AWS_REGION || 'us-east-1';
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  
  if (accessKeyId && secretAccessKey) {
    return new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey
      }
    });
  }
  return null;
})();

const bucketName = process.env.AWS_BUCKET_NAME || process.env.AWS_S3_BUCKET;

/**
 * Upload a local file to S3
 * @param {string} localPath - Path to the local file
 * @param {string} key - S3 object key (path in bucket)
 * @param {string} contentType - MIME type of the file
 * @returns {Promise<{bucket: string, key: string, location: string}>}
 */
async function uploadLocalFileToS3(localPath, key, contentType = 'application/octet-stream') {
  if (!s3Client) {
    throw new Error('S3 client not configured. Check AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY');
  }
  
  if (!bucketName) {
    throw new Error('S3 bucket not configured. Check AWS_BUCKET_NAME');
  }
  
  const fileContent = fs.readFileSync(localPath);
  
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: fileContent,
    ContentType: contentType
  });
  
  await s3Client.send(command);
  
  const location = `https://${bucketName}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
  
  return {
    bucket: bucketName,
    key,
    location
  };
}

/**
 * Delete a file from S3
 * @param {string} key - S3 object key to delete
 * @returns {Promise<void>}
 */
async function deleteFileFromS3(key) {
  if (!s3Client) {
    throw new Error('S3 client not configured');
  }
  
  if (!bucketName) {
    throw new Error('S3 bucket not configured');
  }
  
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key
  });
  
  await s3Client.send(command);
}

module.exports = {
  uploadLocalFileToS3,
  deleteFileFromS3,
  s3Client,
  bucketName
};
