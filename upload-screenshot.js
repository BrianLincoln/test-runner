var AWS = require('aws-sdk');
var config = require('./config/config.js');

AWS.config.accessKeyId = config.AWSAccessKeyId;
AWS.config.secretAccessKey = config.AWSAsecretAccessKey;
AWS.config.region = config.AWSAregion;

module.exports = function(image, fileName) {
    if (!image) {
        console.log("no image");
        return;
    }
    var s3bucket = new AWS.S3({params: {Bucket: 'qa-test-runner'}});
    s3bucket.createBucket(function() {
      var params = {
          Key: fileName,
          Body: image,
          ContentType: 'image/png'
      };
      s3bucket.upload(params, function(err, data) {
        if (err) {
          console.log("Error uploading data: ", err);
        } else {
          console.log("Successfully uploaded screenshot");
        }
      });
    });
};
