"use strict";
const Image = require("./mongoose-models").Image;
const User = require("./mongoose-models").User;

function b32() {
    const length = 11;
    let string = require("crypto").randomBytes(7);
    string = require("base32").encode(string);
    return string.substr(0, length);
}

const multer = require("multer");
const storage = multer.diskStorage({
    destination: function(req, file, callback) {
        callback(null, "images/");
    },
    filename: function(req, file, callback) {
        file.imageId = b32();
        let extension;
        if      (file.mimetype == "image/jpeg") extension = ".jpg";
        else if (file.mimetype == "image/png") extension = ".png";
        else res.err = "wrongExt";
        callback(null, file.imageId+extension);
    }
});
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 30*1000*1000
    }
});
function multerUpload(path, fileSize) {
    return multer({
        storage: multer.diskStorage({
            destination: function(req, file, callback) {
                callback(null, path);
            },
            filename: function(req, file, callback) {
                file.imageId = b32();
                let extension;
                if      (file.mimetype == "image/jpeg") extension = ".jpg";
                else if (file.mimetype == "image/png") extension = ".png";
                else res.err = "wrongExt";
                callback(null, file.imageId+extension);
            }
        }),
        limits: {
            fileSize: fileSize
        }
    });
}
const imageUpload = multerUpload("images/", 30*1000*1000);
const profilePictureUpload = multerUpload("profile-pictures/", 5*1000*1000);

module.exports = (app) => {

    app.post("/upload", (req, res) => {
        let errors = [];
        function sendResponse() {
            res.json({
                errors: errors,
                redirect: req.query.redirect || "/",
            });
        }

        if (res.locals.loggedIn) {
            upload.array("image", 1)(req, res, function(err) {
                if (err) {
                    // error when uploading
                    console.log("ERROR UPLOADING");
                    console.log(err);
                    return;
                }
                // success
                // console.log("SUCCESS UPLOADING");
                // req.files[0].filename;
                // req.files[0].path;
                // console.log(req.files);
                // console.log(req.body);

                let title = req.body.title;
                let description = req.body.description;
                let tags = JSON.parse(req.body.tags);

                new Image({
                    userId: res.locals.userId,
                    filename: req.files[0].filename,
                    imageId: req.files[0].imageId,
                    title: title,
                    description: description,
                    tags: tags,
                }).save((err) => {
                    if (err) errors.push("unknown 5");
                    sendResponse();
                });
            });
        }
    });

    app.post("/update-settings", (req, res) => {
        let errors = [];
        function sendResponse() {
            res.json({
                errors: errors,
                redirect: req.query.redirect || "/",
            });
        }

        if (res.locals.loggedIn) {
            profilePictureUpload.array("image", 1)(req, res, function(err) {
                if (err) {
                    // error when uploading
                    errors.push(err);
                    return;
                }
                // success
                // console.log("SUCCESS UPLOADING");
                // console.log(req.files);
                // console.log(req.body);
                const updatedUser = {
                    displayname: req.body.displayname,
                    email: req.body.email,
                    bio: req.body.bio,
                }
                if (req.files.length == 1) {
                    updatedUser.profilePictureURL = "/pp/"+req.files[0].filename;
                }

                User.findOneAndUpdate({
                    _id: res.locals.userId
                }, updatedUser, (err, resultUser) => {
                    res.json({
                        errors: errors,
                    });
                });


            });
        }
    });

}
