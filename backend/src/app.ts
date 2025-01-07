import express, { Request, Response } from 'express';

const app = express();

// A simple route to test
app.get('/', (req: Request, res: Response) => {
  res.status(200).send('Hello, world!');
});

export default app;
