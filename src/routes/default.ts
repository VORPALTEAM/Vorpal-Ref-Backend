import { apiVersion } from '../config';
import { app } from '../server';

export function initDefaultRoutes() {
    app.get('/', (req, res) => {
        res.status(200).send({ text: 'API homepage' });
      });

    app.get('/api/version', (req, res) => {
        res.status(200).send({ version: apiVersion })
    })

    /* app.use((req, res) => {
        res.status(404).send({ error: "Invalid route" })
    }) */
    
}