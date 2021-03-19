import { Response, NextFunction } from "express";
import { body, validationResult, ValidationChain } from 'express-validator';
import { userProfile, userProfileModel, memberAttribute } from "@appitzr-project/db-model";
import { RequestAuthenticated, userDetail } from "@base-pojokan/auth-aws-cognito";
import * as AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

// declare database dynamodb
const ddb = new AWS.DynamoDB.DocumentClient({ endpoint: process.env.DYNAMODB_LOCAL, convertEmptyValues: true });

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