import { Response, NextFunction } from "express";
import { body, validationResult, ValidationChain } from 'express-validator';
import { cultureCategory, venueAttribute, venueProfile, venueProfileModel } from "@appitzr-project/db-model";
import { RequestAuthenticated, validateGroup } from "@base-pojokan/auth-aws-cognito";
import * as AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

// declare database dynamodb
const ddb = new AWS.DynamoDB.DocumentClient({ endpoint: process.env.DYNAMODB_LOCAL, convertEmptyValues: true });

/**
 * Venue Profile Store Validation with Express Validator
 */
export const profileStoreValidate : ValidationChain[] = [
  body('venueName').notEmpty().isString(),
  body('bankBSB').notEmpty().isString(),
  body('bankName').notEmpty().isString(),
  body('bankAccountNo').notEmpty().isString(),
  body('phoneNumber').notEmpty().isString(),
  body('address').notEmpty().isString(),
  body('postalCode').notEmpty().isNumeric(),
  body('long').notEmpty().isNumeric(),
  body('lat').notEmpty().isNumeric(),
  body('cultureCategory').notEmpty().isIn(cultureCategory),
];

/**
 * Venue Profile Update Validation with Express Validator
 */
export const profileUpdateValidate : ValidationChain[] = [
  body('venueName').notEmpty().isString(),
  body('bankBSB').notEmpty().isString(),
  body('bankName').notEmpty().isString(),
  body('bankAccountNo').notEmpty().isString(),
  body('phoneNumber').notEmpty().isString(),
  body('address').notEmpty().isString(),
  body('postalCode').notEmpty().isNumeric(),
  body('long').notEmpty().isNumeric(),
  body('lat').notEmpty().isNumeric(),
  body('cultureCategory').notEmpty().isIn(cultureCategory),
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
    const userDetail = await validateGroup(req, "venue");

    // dynamodb parameter
    const paramDB : AWS.DynamoDB.DocumentClient.GetItemInput = {
      TableName: venueProfileModel.TableName,
      Key: {
        venueEmail: userDetail.email,
        cognitoId: userDetail.sub
      }
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
    // validate group
    const userDetail = await validateGroup(req, "venue");

    // exapress validate input
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // get input
    const venue : venueProfile = req.body;

    // venue profile input with typescript definition
    const venueInput : venueProfile = {
      id: uuidv4(),
      cognitoId: userDetail?.sub,
      venueEmail: userDetail?.email,
      venueName: venue.venueName,
      bankBSB: venue.bankBSB,
      bankName: venue.bankName,
      bankAccountNo: venue.bankAccountNo,
      phoneNumber: venue.phoneNumber,
      address: venue.address,
      postalCode: venue.postalCode,
      long: venue.long,
      lat: venue.lat,
      cultureCategory: venue.cultureCategory,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // dynamodb parameter
    const paramsDB : AWS.DynamoDB.DocumentClient.PutItemInput = {
      TableName: venueProfileModel.TableName,
      Item: venueInput,
      ConditionExpression: 'attribute_not_exists(venueEmail)'
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
    const userDetail = await validateGroup(req, "venue");

    // exapress validate input
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // get input
    const venue : venueProfile = req.body;

    // dynamodb parameter
    const paramsDB : AWS.DynamoDB.DocumentClient.UpdateItemInput = {
      TableName: venueProfileModel.TableName,
      Key: {
        venueEmail: userDetail.email,
        cognitoId: userDetail.sub
      },
      UpdateExpression: `
        set
          venueName = :vn,
          bankBSB = :bbsb,
          bankName = :bn,
          bankAccountNo = :ban,
          phoneNumber = :pn,
          address = :adrs,
          postalCode = :pc,
          maplong = :mlong,
          maplat = :mlat,
          cultureCategory = :ccat,
          updatedAt = :ua
      `,
      ExpressionAttributeValues: {
        ':vn': venue.venueName,
        ':bbsb': venue.bankBSB,
        ':bn': venue.bankName,
        ':ban': venue.bankAccountNo,
        ':pn': venue.phoneNumber,
        ':adrs': venue.address,
        ':pc': venue.postalCode,
        ':mlong': venue.long,
        ':mlat': venue.lat,
        ':ccat': venue.cultureCategory,
        ':ua': new Date().toISOString(),
      },
      ReturnValues: 'UPDATED_NEW',
      ConditionExpression: 'attribute_exists(venueEmail)'
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