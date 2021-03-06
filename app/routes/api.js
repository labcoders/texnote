var express = require('express');
var fs = require('fs');
var router = express.Router();
var exec = require('child_process').exec;

router.post('/compile', function(req, res) {
    var dirPath = ["files", req.body.username].join('/');
    var docPath = [dirPath, "persistent", req.body.documentName].join('/');
    var tmpPath = [dirPath, "temp"].join('/');

    exec(['pdflatex -halt-on-error -output-directory', tmpPath, docPath].join(' '), function(error, stdout, stderr) {
        res.send({
            stdout: stdout,
            error: error,
            stderr: stderr
        })
    });
});
router.post('/write', function(req, res) {
    if(!req.body.documentName.match(/\.tex$/)) {
        res.send({
            status: "fail",
            message: "document name does not end in .tex"
        });

        return
    }

    var path = ["files", req.body.username, "persistent", req.body.documentName].join('/')

    var writeContents = function() {
        fs.writeFile(path, req.body.contents, function(err) {
            if(err) {
                res.send({
                    status: "fail",
                    message: "unable to write file"
                });
            }
            else {
                res.send({
                    status: "ok",
                    documentName: req.body.documentName
                });
            }
        });
    }

    if(req.body.contents) {
        writeContents();
    }
    else {
        fs.readFile("private/template.tex", function(err, data) {
            if (err) {
                writeContents(); // failed to load template, so write empty text.
            }
            else {
                fs.writeFile(path, data, function(err) {
                    if(err) {
                        res.send({
                            status: "fail",
                            message: "unable to write template"
                        });
                    }

                    res.send({
                        status: "ok",
                        documentName: req.body.documentName
                    });
                });
            }
        });
    }
});

router.post('/all', function(req, res) {
    var dirPath = ["files", req.body.username].join('/');
    var docPath = [dirPath, "persistent", req.body.documentName].join('/');
    var tmpPath = [dirPath, "temp"].join('/');
    var path = ["files", req.body.username, "persistent", req.body.documentName].join('/')

    fs.writeFile(path, req.body.contents, function(err) {
        if (err) {
            res.send({
                status: "fail",
                message: "unable to write file"
            });
        }
        else {
			exec(['pdflatex -halt-on-error -output-directory', tmpPath, docPath].join(' '), function(error, stdout, stderr) {
                res.send({
                    status: "ok",
                    documentName: req.body.documentName,
                    stdout: stdout,
                    error: error,
                    stderr: stderr
                });
            });
        }
	});
});

router.get('/pdf/:username/:documentName', function(req, res) {
    var path = ["files", req.params.username, "temp", req.params.documentName.substring(0,req.params.documentName.length-4)].join('/');
    path = [path, ".pdf"].join('');
    res.sendFile(path);
});

router.get('/read/:username/:documentName', function(req, res) {
    var path = ["files", req.params.username, "persistent", req.params.documentName].join('/')
    fs.readFile(path, { encoding: "utf-8" }, function(err, data) {
        if(err) {
            res.send({
                status: "fail",
                message: "file not found"
            })
        }
        else {
            res.send({
                status: "ok",
                username: req.params.username,
                documentName: req.params.documentName,
                contents: data
            });
        }
    });
});

router.get('/list/:username', function(req, res) {
    var path = ["files", req.params.username, "persistent"].join('/')
    fs.readdir(path, function(err, files) {
        if(err) {
            res.send({
                status: "fail",
                message: "unable to get files",
                username: req.params.username
            });
        }
        else {
            res.send({
                status: "ok",
                username: req.params.username,
                files: files
            });
        }
    });
});

module.exports = router;
