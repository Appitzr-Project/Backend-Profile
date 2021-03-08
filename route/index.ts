import * as express from 'express';
import { profileIndex } from '../controller/profileController';

// Route Declare
const route = express.Router();

// Route List
route.get('/', profileIndex);

// export all route
export default route;