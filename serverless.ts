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
                    },
                },
                {
                    http: {
                        method: 'ANY',
                        path: '/{proxy+}',
                        cors: true,
                    },
                },
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
            basePath: 'venue',
            stage: '${opt:stage, "dev"}',
            createRoute53Record: true,
        }
    },
};

module.exports = serverlessConfiguration;
