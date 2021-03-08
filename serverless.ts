import type { Serverless } from 'serverless/aws';

const serverlessConfiguration: Serverless = {
    service: 'backend-venue-profile',
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
        memorySize: 128,
        apiGateway: {
            minimumCompressionSize: 1024,
        },
        environment: {
            AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
        },
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
                            arn: '${env.COGNITO_POOL_ID}',
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
                            arn: '${env.COGNITO_POOL_ID}',
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
            includeModules: true,
        },
        customDomain: {
            domainName: 'api.dev.appetizr.co',
            basePath: 'venueprofile',
            stage: '${opt:stage, "dev"}',
            createRoute53Record: true,
            certificateName: 'api.dev.appetizr.co',
            endpointType: 'regional',
            securityPolicy: 'tls_1_2',
            apiType: 'rest',
            autoDomain: false,
        }
    },
};

module.exports = serverlessConfiguration;
