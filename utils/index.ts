import { Request } from 'express';

export interface ClaimsData {
    [key: string]: string;
}

export interface Claims {
    claims: ClaimsData
}

export interface RequestContext {
    authorizer: Claims
}

export interface RequestAuthenticated extends Request {
    context: RequestContext
}