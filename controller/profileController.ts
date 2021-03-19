import { Response, NextFunction } from "express";
import { body, validationResult, ValidationChain } from 'express-validator';
import { userProfile, userProfileModel, memberAttribute } from "@appitzr-project/db-model";
import { RequestAuthenticated, userDetail } from "@base-pojokan/auth-aws-cognito";
import * as AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import * as Multer from 'multer';
import * as fs from 'fs';

// declare database dynamodb
const ddb = new AWS.DynamoDB.DocumentClient({ endpoint: process.env.DYNAMODB_LOCAL, convertEmptyValues: true });

/**
 * Multer Storage and Upload
 */
const multerUpload = Multer({ dest: '/tmp' });

/**
 * Venue Profile Store Validation with Express Validator
 */
export const profileStoreValidate : ValidationChain[] = [
  body('memberName').notEmpty().isString(),
  body('mobileNumber').notEmpty().isString(),
];

/**
 * Venue Profile Update Validation with Express Validator
 */
export const profileUpdateValidate : ValidationChain[] = [
  body('memberName').notEmpty().isString(),
  body('mobileNumber').notEmpty().isString(),
];

/**
 * Validator Image Input For Single File
 * Maximum File Size Limit 5 Mb
 * And Format .jpeg, .jpg, and .png
 */
export const profilePictureValidate : any[] = [
  multerUpload.single('profilePicture'),
  body('profilePicture')
    .custom((value, {req}) => {
      // size limit 5 MB in byte
      const fileLimit : number = 5242880;

      // check if file exist
      // and size file under fileLimit
      if(req.file && req.file.size < fileLimit) {
        // check mime type file
        if(req.file.mimetype === 'image/png'){
          return '.png';
        } else if(req.file.mimetype === 'image/jpeg'){
          return '.jpeg';
        } else {
          throw new Error('Format Allowed: .jpeg, .jpg or .png');
        }
      } else {
        throw new Error('Upload File Required With Maximum File Size 5 MB/File.!');
      }
    }),
];

/**
 * Index Data Function
 *
 * @param req
 * @param res
 * @param next
 */
export const profileIndex = async (
  req: RequestAuthenticated,
  res: Response,
  next: NextFunction
) => {
  try {
    // validate group
    const user = userDetail(req);

    // dynamodb parameter
    const paramDB : AWS.DynamoDB.DocumentClient.GetItemInput = {
      TableName: userProfileModel.TableName,
      Key: {
        email: user.email,
        cognitoId: user.sub
      },
      AttributesToGet: memberAttribute
    }

    // query to database
    const queryDB = await ddb.get(paramDB).promise();

    // return response
    return res.json({
      code: 200,
      message: "success",
      data: queryDB?.Item
    });
  } catch (e) {
    next(e);
  }
};

/**
 * Store data to database
 * 
 * @param req RequestAuthenticated
 * @param res Response
 * @param next NextFunction
 * @returns 
 */
export const profileStore = async (
  req: RequestAuthenticated,
  res: Response,
  next: NextFunction
) => {
  try {
    // get userdetail from header
    const user = userDetail(req);

    // exapress validate input
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // get input
    const member : userProfile = req.body;

    // member profile input with typescript definition
    const memberInput : userProfile = {
      id: uuidv4(),
      cognitoId: user?.sub,
      email: user?.email,
      memberName: member.memberName,
      mobileNumber: member.mobileNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // dynamodb parameter
    const paramsDB : AWS.DynamoDB.DocumentClient.PutItemInput = {
      TableName: userProfileModel.TableName,
      Item: memberInput,
      ConditionExpression: 'attribute_not_exists(email)'
    }

    // save data to database
    await ddb.put(paramsDB).promise();

    // return result
    return res.status(200).json({
      code: 200,
      message: 'success',
      data: paramsDB?.Item
    });

  } catch (e) {
    
    /**
     * Return error kalau expression data udh ada
     */
    if(e?.code == 'ConditionalCheckFailedException') {
      next(new Error('Data Already Exist.!'));
    }

    // return default error
    next(e);
  }
};


export const profileUpdate = async (
  req: RequestAuthenticated,
  res: Response,
  next: NextFunction
) => {
  try {
    // validate group
    const user = userDetail(req);

    // exapress validate input
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // get input
    const member : userProfile = req.body;

    // dynamodb parameter
    const paramsDB : AWS.DynamoDB.DocumentClient.UpdateItemInput = {
      TableName: userProfileModel.TableName,
      Key: {
        email: user.email,
        cognitoId: user.sub
      },
      UpdateExpression: `
        set
          memberName = :nm,
          mobileNumber = :mn,
          updatedAt = :ua
      `,
      ExpressionAttributeValues: {
        ':nm': member.memberName,
        ':mn': member.mobileNumber,
        ':ua': new Date().toISOString(),
      },
      ReturnValues: 'UPDATED_NEW',
      ConditionExpression: 'attribute_exists(email)'
    }

    // save data to database
    const queryDB = await ddb.update(paramsDB).promise();

    // return result
    return res.status(200).json({
      code: 200,
      message: 'success',
      data: queryDB?.Attributes
    });
  } catch (e) {
    console.log(e);
    next(e);
  }
};

export const profileChange = async (
  req: RequestAuthenticated,
  res: Response,
  next: NextFunction
) => {
  try {
    // validate group
    const user = userDetail(req);

    // exapress validate input
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // get file upload
    // types from Global Express
    const fileUpload  = req.file;

    // file extention
    let fileExtention : string;
    if(fileUpload.mimetype === 'image/png' ) {
      fileExtention = '.png';
    } else if(fileUpload.mimetype === 'image/jpeg') {
      fileExtention = '.jpeg';
    }

    // generate filename with uuid
    const fileName : string = uuidv4() + fileExtention;

    // generate path directory
    const date = new Date();
    const year : number = date.getFullYear();
    const month : number = date.getMonth() + 1;
    const day : number = date.getDate();

    // generate filename with path
    const fullFileName : string = `${year}/${month}/${day}/${fileName}`;
    // generate URL with Full Name
    const fileURL = 'https://' + process.env.AWS_S3_BUCKET + '/' + fullFileName;

    /**
     * Upload File to AWS S3
     */
    const S3 = new AWS.S3();
    
    // S3 Action Upload Fsile
    const uploadToS3 = await S3.upload({
      ACL: 'public-read',
      Bucket: process.env.AWS_S3_BUCKET,
      Body: Buffer.from(fs.readFileSync(fileUpload.path, 'base64'), 'base64'),
      Key: fullFileName,
      ContentType: fileUpload.mimetype,
    }).promise();

    // // get input
    // const member : userProfile = req.body;

    // // dynamodb parameter
    // const paramsDB : AWS.DynamoDB.DocumentClient.UpdateItemInput = {
    //   TableName: userProfileModel.TableName,
    //   Key: {
    //     email: user.email,
    //     cognitoId: user.sub
    //   },
    //   UpdateExpression: `
    //     set
    //       profilePicture = :nm,
    //       mobileNumber = :mn,
    //       updatedAt = :ua
    //   `,
    //   ExpressionAttributeValues: {
    //     ':pp': member.memberName,
    //     ':mn': member.mobileNumber,
    //     ':ua': new Date().toISOString(),
    //   },
    //   ReturnValues: 'UPDATED_NEW',
    //   ConditionExpression: 'attribute_exists(email)'
    // }

    // // save data to database
    // const queryDB = await ddb.update(paramsDB).promise();

    // return result
    return res.status(200).json({
      code: 200,
      message: 'success',
      data: {
        url: fileURL,
        s3: uploadToS3,
        file: fileUpload
      }
    });
  } catch (e) {
    console.log(e);
    next(e);
  }
};