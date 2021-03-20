import type { Serverless } from 'serverless/aws';

const serverlessConfiguration: Serverless = {
    service: 'backend-profile',
    frameworkVersion: '2',
    // Add the serverless-webpack plugin
    plugins: [
        'serverless-webpack',
        'serverless-domain-manager',
        'serverless-offline',
        'serverless-dotenv-plugin',
    ],
    provider: {
        name: 'aws',
        runtime: 'nodejs12.x',
        region: '${opt:region, "ap-southeast-2"}',
        stage: '${opt:stage, "dev"}',
        memorySize: 256,
        timeout: 15,
        apiGateway: {
            minimumCompressionSize: 0,
            binaryMediaTypes: [ '*/*' ],
        },
        environment: {
            AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
            NODE_ENV: '${env:NODE_ENV}',
            AWS_S3_BUCKET: '${env:AWS_S3_BUCKET}',
            COGNITO_POOL_ID: '${env:COGNITO_POOL_ID}'
        },
        // Grant Access to DynamoDB
        iamRoleStatements: [
            {
                Effect: 'Allow',
                Action: [
                    "dynamodb:BatchGetItem",
                    "dynamodb:GetItem",
                    "dynamodb:Query",
                    "dynamodb:Scan",
                    "dynamodb:BatchWriteItem",
                    "dynamodb:PutItem",
                    "dynamodb:UpdateItem"
                ],
                Resource: [
                    'arn:aws:dynamodb:${opt:region, "ap-southeast-2"}:${env:AWS_ACCOUNT_ID}:table/${env:NODE_ENV}_VenueProfile',
                    'arn:aws:dynamodb:${opt:region, "ap-southeast-2"}:${env:AWS_ACCOUNT_ID}:table/${env:NODE_ENV}_UserProfile',
                ],
            },
            {
                Effect: 'Allow',
                Action: [
                    "s3:GetObject",
                    "s3:PutObject",
                    "s3:PutObjectAcl"
                ],
                Resource: [
                    'arn:aws:s3:::${env:AWS_S3_BUCKET}',
                    'arn:aws:s3:::${env:AWS_S3_BUCKET}/*'
                ]
            },
            {
                Effect: 'Allow',
                Action: [
                    "cognito-idp:AdminAddUserToGroup",
                ],
                Resource: '${env:COGNITO_POOL_ID}'
            }
        ],
    },
    functions: {
        app: {
            handler: 'handler.handler',
            events: [
                {
                    http: {
                        method: 'ANY',
                        path: '/',
                        cors: true,
                        authorizer: {
                            type: 'COGNITO_USER_POOLS',
                            name: 'Cognito-1',
                            arn: '${self:custom.project.cognito}',
                            identitySource: 'method.request.header.Authorization',
                        }
                    },
                },
                {
                    http: {
                        method: 'ANY',
                        path: '/{proxy+}',
                        cors: true,
                        authorizer: {
                            type: 'COGNITO_USER_POOLS',
                            name: 'Cognito-2',
                            arn: '${self:custom.project.cognito}',
                            identitySource: 'method.request.header.Authorization'
                        }
                    },
                }
            ],
        },
    },
    custom: {
        webpack: {
            webpackConfig: './webpack.config.js',
            includeModules: {
                forceExclude: [
                    'aws-sdk'
                ],
            },
        },
        project: {
            cognito: '${env:COGNITO_POOL_ID}',
            dev: 'api.dev.appetizr.co',
            prod: 'api.appetizr.co',
        },
        customDomain: {
            domainName: '${self:custom.project.${opt:stage, "dev"}}',
            certificateName: '${self:custom.project.${opt:stage, "dev"}}',
            basePath: 'profile',
            stage: '${opt:stage, "dev"}',
            createRoute53Record: true,
            endpointType: 'regional',
            securityPolicy: 'tls_1_2',
            apiType: 'rest',
            autoDomain: false,
        },
        dotenv: {
            exclude: [
                'AWS_ACCESS_KEY_ID',
                'AWS_SECRET_ACCESS_KEY',
                'AWS_REGION',
                'DYNAMODB_LOCAL'
            ],
        },
    },
};

module.exports = serverlessConfiguration;
