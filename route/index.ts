import * as express from 'express';
import { Request, Response } from 'express';
import { profileIndex, profileStore, profileStoreValidate, profileUpdate, profileUpdateValidate } from '../controller/profileController';

// Route Declare
const route = express.Router();

// Route List
route.get('/venue', profileIndex);
route.post('/venue', profileStoreValidate, profileStore);
route.put('/venue', profileUpdateValidate, profileUpdate);

// health check api
route.get('/health-check', (req: Request, res: Response) => {
    return res.status(200).json({
        code: 200,
        message: 'success',
        headers: req.headers
    });
})

// export all route
export default route;