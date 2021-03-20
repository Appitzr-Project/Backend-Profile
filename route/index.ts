import * as express from 'express';
import { Request, Response } from 'express';
import {
    profileChange,
    profileIndex, 
    profilePictureValidate, 
    profileStore, 
    profileStoreValidate, 
    profileUpdate, 
    profileUpdateValidate
} from '../controller/profileController';
import { 
    profileVenueChange,
    profileVenueIndex,
    profilePictureVenueValidate,
    profileVenueStore,
    profileVenueStoreValidate,
    profileVenueUpdate,
    profileVenueUpdateValidate
} from '../controller/profileVenueController';

// Route Declare
const route = express.Router();

// Route List Member
route.get('/', profileIndex);
route.post('/', profileStoreValidate, profileStore);
route.put('/', profileUpdateValidate, profileUpdate);
route.post('/change', profilePictureValidate, profileChange);

// Route List Venue
route.get('/venue', profileVenueIndex);
route.post('/venue', profileVenueStoreValidate, profileVenueStore);
route.put('/venue', profileVenueUpdateValidate, profileVenueUpdate);
route.post('/venue/change', profilePictureVenueValidate, profileVenueChange)

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