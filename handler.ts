import 'source-map-support/register';
import * as express from 'express';
import { Request, Response, NextFunction } from 'express';
import * as helmet from 'helmet';
import * as serverless from 'serverless-http';

// express instance
const app = express();

// express middleware
app.disable('x-powered-by');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(helmet());

// all router lists
app.get('/venue/profile', (req: Request, res: Response, next: NextFunction) => {
    return res.status(200).json({
        code: 200,
        message: 'success',
        data: {
            satu: 1,
        }
    });
});

// get all unrouted url
app.all('*', (req: Request, res: Response, next: NextFunction) => {
    next(new Error(`Route Not Found: [${req.method}] ${req.path}`));
});

// Error Handle
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
    res.status(422).json({
        code: 422,
        success: false,
        message: error.message,
    });
});

// export to serverless
export const handler = serverless(app);
