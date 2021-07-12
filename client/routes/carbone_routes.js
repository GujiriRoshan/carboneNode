const express = require('express')

const router = express.Router();

const multer = require('multer');
const {body} = require('express-validator')

var storage = multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,'template')
    },
    filename:function(req,file,cb){
        cb(null,file.originalname)
    }
})

var upload = multer({storage:storage})

const carbone_controller = require('../controller/carbone_controller')
 
router.post('/addTemplate',upload.single('template'),carbone_controller.addtemplate);

router.post('/template',
// [
// body('convertTo').notEmpty().withMessage('extension is required like convertTo'),
// // body('templateId').notEmpty().withMessage('templateId is required'),
// // body('recordId').notEmpty().withMessage('recordId is required')
// ],
carbone_controller.GenerateDocument);

router.post('/carboneDocumentGenerator',carbone_controller.documentGenerator) //original 


router.post('/generateDocument',carbone_controller.CarboneDocumentGenerator)

module.exports= router