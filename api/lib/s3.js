const { promisify } = require("util");
const fs = require("fs");
const path = require("path");
const AWS = require("aws-sdk");
const {
  objectStorageRegion,
  objectStorageApiVersion,
  objectStorageBaseUrl,
  objectStorageACLPublic,
  objectStorageACLPrivate
} = require("./constants");

const s3Client = new AWS.S3({
  region: objectStorageRegion,
  endpoint: objectStorageBaseUrl,
  apiVersion: objectStorageApiVersion,
  credentials: new AWS.Credentials({
    accessKeyId: process.env.LINODE_OBJECT_STORAGE_ACCESS_KEY,
    secretAccessKey: process.env.LINODE_OBJECT_STORAGE_SECRET_ACCESS_KEY
  })
});

const listBuckets = promisify(s3Client.listBuckets).bind(s3Client);
const headBucket = promisify(s3Client.headBucket).bind(s3Client);
const createBucket = promisify(s3Client.createBucket).bind(s3Client);
const upload = promisify(s3Client.upload).bind(s3Client);
const listObjects = promisify(s3Client.listObjectsV2).bind(s3Client);
const headObject = promisify(s3Client.headObject).bind(s3Client);
const deleteObjects = promisify(s3Client.deleteObjects).bind(s3Client);
const copyObject = promisify(s3Client.copyObject).bind(s3Client);

/**
 * creates a bucket if it doesn't exist
 */
async function assertBucket(name) {
  try {
    await headBucket({ Bucket: name });
    return true;
  } catch (err) {
    // check err.statusCode === 404
  }
  // bucket doesn't exist - create it
  return createBucket({ Bucket: name });
}

async function uploadFileToBucket(bucket, fileNameWithAbsolutePath) {
  const fileStream = fs.createReadStream(fileNameWithAbsolutePath);
  fileStream.on("error", err => {
    console.log("uploadFileToBucket - File Error", err);
  });
  // call S3 to retrieve upload file to specified bucket
  return upload({
    Bucket: bucket,
    Body: fileStream,
    Key: path.basename(fileNameWithAbsolutePath)
  });
}

async function uploadImageToBucket(
  bucket,
  key,
  buffer,
  metadata,
  public = false
) {
  return upload({
    Bucket: bucket,
    Body: buffer,
    Key: key,
    Metadata: metadata,
    ACL: public ? objectStorageACLPublic : objectStorageACLPrivate
  });
}

async function listKeysForBucket(
  bucket,
  { sortOrder } = { sortOrder: "desc" }
) {
  const response = await listObjects({ Bucket: bucket });
  const comparisonFn =
    sortOrder === "desc"
      ? (a, b) => (a > b ? -1 : 1)
      : (a, b) => (a > b ? 1 : -1);

  if (response.IsTruncated) {
    console.warn(
      "listKeysForBucket",
      "local options: ",
      options,
      "response ",
      response
    );
  }
  return response.Contents.map(({ Key }) => Key).sort(comparisonFn);
}

async function bucketHasKey(bucket, key) {
  return headObject({ Bucket: bucket, Key: key });
}

async function copyKeyFromBucketToBucket(bucketSrc, bucketDest, key) {
  return copyObject({
    Bucket: bucketDest,
    CopySource: `/${bucketSrc}/${key}`,
    Key: key
  });
}

async function deleteKeysForBucket(bucket, keys) {
  const formattedKeys = keys.map(k => ({ Key: k }));
  const params = {
    Bucket: bucket,
    Delete: {
      Objects: formattedKeys,
      Quiet: false
    }
  };
  return deleteObjects(params);
}

module.exports = {
  listBuckets,
  assertBucket,
  uploadImageToBucket,
  uploadFileToBucket,
  listKeysForBucket,
  bucketHasKey,
  copyKeyFromBucketToBucket,
  deleteKeysForBucket
};

/*
async function test() {
  try {
    const { Buckets } = await listBuckets();
    console.log('Buckets: ', Buckets);
    const bucketName = 'filbert-dev-mysqlbackups-hourly';
    await assertBucket(bucketName);
    const sampleFile = '/Users/jd/dev/filbert/api/cron/daily/2020-01-02_115309.sql'
    // const uploadResponse = await uploadFileToBucket(bucketName, sampleFile);
    let objects = await listKeysForBucket(bucketName);
    const deleted = await deleteKeysForBucket(bucketName, objects);
    objects = await listKeysForBucket(bucketName);
    console.log(objects);
  } catch (err) {
    console.error('main() error: ', err);
    process.exitCode = 1;
  }
}

//test();
//process.exitCode = 0;
 */