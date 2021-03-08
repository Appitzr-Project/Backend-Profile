import { Response, NextFunction } from 'express';
import { venueProfileType } from '@appitzr-project/db-model';
import { RequestAuthenticated } from '../utils';

/**
 * Index Data Function
 */
export const profileIndex = (req: RequestAuthenticated, res: Response, next: NextFunction) => {
    try {

        const venueProfile : venueProfileType = {
            id: '12345',
            venue: 'Opera House',
            email: 'operahouse@test.com',
            bankName: 'Opera House',
            bankAccountNo: '02123444',
            phoneNumber: '011129222',
            postalCode: 22211,
            long: 111111,
            lat: 333333
        }

        // get context detail user
        const { context } = req;

        // return response
        return res.json({
            code: 200,
            message: 'success',
            data: {
                profile: {
                    email: context?.authorizer?.claims['email'],
                    sub: context?.authorizer?.claims['sub'],
                    groups: context?.authorizer?.claims['cognito:groups'],
                    phone_number: context?.authorizer?.claims['phone_number']
                },
                venue: venueProfile
            }
        })
    } catch (e) {
        next(e);
    }
}