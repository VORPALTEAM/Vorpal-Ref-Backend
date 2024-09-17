import express from 'express';
import bodyParser from 'body-parser';
import { setupHeadersGlobal } from './controllers';

const app = express();

// End boxes
app.use(setupHeadersGlobal);
app.use(express.json());

app.use(
  bodyParser.urlencoded({
    extended: true,
  }),
);

export { app };
