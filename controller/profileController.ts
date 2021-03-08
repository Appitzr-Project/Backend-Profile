import {Request, Response, NextFunction} from 'express';

/**
 * Index Data Function
 */
export const profileIndex = (req: Request, res: Response, next: NextFunction) => {
    try {
        return res.json({
            'code': 200,
            'message': 'success'
        })
    } catch (e) {
        next(e);
    }
}