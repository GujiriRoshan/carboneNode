const jsforce = require('../../jsforceConnection')
const carbone = require('carbone')
const { validationResult } = require('express-validator')
const fs = require('fs')
const axios = require('axios');
exports.addtemplate = async (req, res, next) => {
    const file = req.file
    if (!file) {
        const error = new Error('Please upload a file')
        error.httpStatusCode = 400
        return next(error)
    }
    jsforce.sobject('Template__c').create({
        Name: file.originalname
    })
        .then(result => {
            jsforce.sobject('Template__c').find({ Id: result.id })
                .then(templateId => {
                    templateId.forEach(id => {
                        // console.log(id.Id)
                        res.json({
                            templateId: id.templateId__c,
                            recordId: id.Id
                        })
                    })
                })
                .catch(err => {
                    console.log(err)
                })
        })
        .catch(err => {
            console.log(err)
        })
}

exports.GenerateDocument = async (req, res, next) => {
    try {
        var data = {
            ...req.body
        }
        const validationError = validationResult(req)
        if (!validationError.isEmpty()) {
            const error = validationError.array();
            error.statusCode = 422;
            return res.json(error)
        }
        const templateInfo = await jsforce.sobject('Template__c').find({ templateId__c: data.config.templateId, Id: data.config.recordId })
        if (!templateInfo) {
            return res.json({
                message: 'Something went wrong please try again.'
            })
        }
        templateInfo.forEach(element => {
            carbone.render(`./template/${element.Name}`, data.data, async (err, result) => {
                if (err) {
                    console.log(err)
                }
                fs.writeFileSync(`output/${element.Name}.${data.config.convertTo}`, result)
                jsforce.sobject('Documents__c').create({
                    Name: `${element.Name}.${data.config.convertTo}`
                })
                    .then(result => {
                        res.json({
                            message: "click this link to download your document",
                            link: `${req.headers.host}/${element.Name}.${data
                                .config.convertTo}`
                        })
                    })
                    .catch(err => {
                        console.log(err)
                    })
            })
        })
    }
    catch (err) {
        console.log(err)
    }
}

exports.documentGenerator = async (req, res) => {
    try {
        const data = {
            ...req.body
        }
        const validationError = validationResult(req)
        if (!validationError.isEmpty()) {
            const error = validationError.array();
            error.statusCode = 422;
            return res.json(error)
        }

        //Fetching the template name
        const templateId = data.config.templateId

        const { records } = await jsforce.query("SELECT Id,Name FROM Template__c WHERE templateId__c = '" + templateId + "' ");

        const file = await jsforce.query("SELECT Id,Name,Body FROM Attachment WHERE ParentId ='" + records[0].Id + "'");

        const fileName = file.records[0].Name;
        const fileOut = fs.createWriteStream(`./template/${fileName}`);
        const fileData = jsforce.sobject('Attachment').record(file.records[0].Id).blob('Body').pipe(fileOut);

        fileData.on('finish', () => {
            carbone.render(`./template/${fileName}`, data.data, data.config, async (err, result) => {
                if (err) {
                    console.log(err)
                    return;
                }
                const output = fileName.slice(0, -4);
                const outputFileName = `${output}.${data.config.convertTo}`;
                fs.writeFileSync(`output/${outputFileName}`, result);
                fs.unlinkSync(`./template/${fileName}`);

                var fileOnServer = `./output/${outputFileName}`;
                uploadFileName = `${outputFileName}`,
                    fileType = 'image/pdf';

                await fs.readFile(fileOnServer, function (err, filedata) {
                    if (err) {
                        console.error(err);
                    }
                    else {
                        var base64data = new Buffer.from(filedata).toString('base64');
                        jsforce.sobject('Attachment').create({
                            ParentId: data.config.recordId,
                            Name: uploadFileName,
                            Body: base64data,
                            ContentType: fileType,
                        },
                            function (err, uploadedAttachment) {
                                if (err) { console.log(err) }

                                console.log(uploadedAttachment);
                            });
                    }
                });
                res.json({
                    message: "attachment is attached in the salesforce"
                })
                fs.unlinkSync(`./output/${outputFileName}`);
            });
        });

    } catch (err) {
        console.log(err)
    }
}

exports.CarboneDocumentGenerator = async(req,res,next)=>{

    const data = {
        ...req.body
    }
    const validationError = validationResult(req)
    if (!validationError.isEmpty()) {
        const error = validationError.array();
        error.statusCode = 422;
        return res.json(error)
    }

    //Fetching the template name
     const templateId = data.config.templateId

    const fileIno = await jsforce.sobject('Attachment').findOne({where:{id:templateId}})
    const fileName =fileIno.Name
    const fileOut = fs.createWriteStream(`./template/${fileName}`);
    const fileData = jsforce.sobject('Attachment').record(templateId).blob('Body').pipe(fileOut);

    fileData.on('finish', () => {
        carbone.render(`./template/${fileName}`, data.data, data.config, async (err, result) => {
            if (err) {
                console.log(err)
                return;
            }
            const output = fileName.slice(0, -4);
            const outputFileName = `${output}.${data.config.convertTo}`;
            fs.writeFileSync(`output/${outputFileName}`, result);
            fs.unlinkSync(`./template/${fileName}`);

            var fileOnServer = `./output/${outputFileName}`;
            uploadFileName = `${outputFileName}`,
                fileType = 'image/pdf';

            await fs.readFile(fileOnServer, function (err, filedata) {
                if (err) {
                    console.error(err);
                }
                else {
                    var base64data = new Buffer.from(filedata).toString('base64');
                    jsforce.sobject('Attachment').create({
                        ParentId: data.config.recordId,
                        Name: uploadFileName,
                        Body: base64data,
                        ContentType: fileType,
                    },
                        function (err, uploadedAttachment) {
                            if (err) { console.log(err) }

                            console.log(uploadedAttachment);
                        });
                }
            });
            res.json({
                message: "attachment is attached in the salesforce"
            })
            fs.unlinkSync(`./output/${outputFileName}`);
        });
    });

}