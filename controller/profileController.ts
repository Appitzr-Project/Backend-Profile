import {Request, Response, NextFunction} from 'express';
import { venueProfileType } from '@appitzr-project/db-model';

/**
 * Index Data Function
 */
export const profileIndex = (req: Request, res: Response, next: NextFunction) => {
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

        return res.json({
            'code': 200,
            'message': 'success',
            data: venueProfile
        })
    } catch (e) {
        next(e);
    }
}