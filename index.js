import mongoose from 'mongoose';
import { accountsRouter } from './routes/accountsRouter.js';
import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const { USER_DB, USER_PWD, PORT } = process.env;

(async () => {
  try {
    await mongoose.connect(
      `mongodb+srv://${USER_DB}:${USER_PWD}@cluster0.zee7n.mongodb.net/accounts?retryWrites=true&w=majority`,
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log('Conectado');
  } catch (error) {
    console.log('Erro ao conectar');
  }
})();

const app = express();
app.use(express.json());
app.use(accountsRouter);

app.listen(PORT, () => console.log('API Iniciada'));
