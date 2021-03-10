import { Response, NextFunction } from 'express';
import { venueProfileType } from '@appitzr-project/db-model';
import { RequestAuthenticated, validateGroup } from '@base-pojokan/auth-aws-cognito';

/**
 * Index Data Function
 */
export const profileIndex = async (req: RequestAuthenticated, res: Response, next: NextFunction) => {
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

        // validate group
        const userDetail = await validateGroup(req, 'venue');

        // return response
        return res.json({
            code: 200,
            message: 'success',
            data: {
                profile: userDetail,
                venue: venueProfile
            }
        })
    } catch (e) {
        next(e);
    }
}