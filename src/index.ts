import awsLambdaFastify from 'aws-lambda-fastify';

import init from './app';
const proxy = awsLambdaFastify(init());

export const handler = proxy;
