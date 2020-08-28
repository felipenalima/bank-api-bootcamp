import express from 'express';
import { accountsModel } from '../models/accountsModel.js';

const app = express();

//Create Account
app.post('/accounts', async (req, res) => {
  try {
    const account = new accountsModel(req.body);

    await account.save();

    res.send(account);
  } catch (error) {
    res.status(500).send(error);
  }
});

//Retrieve
app.get('/accounts', async (req, res) => {
  try {
    const account = await accountsModel.find({});
    res.send(account);
  } catch (error) {
    res.status(500).send(error);
  }
});

//Update Accounts - Deposit
app.patch('/accounts/deposit', async (req, res) => {
  try {
    const { agencia, conta, valor } = req.body;

    const accountExists = await accountsModel.findOne({ agencia, conta });

    if (!accountExists) {
      throw new Error('Account not found.');
    }

    if (valor < 0) throw new Error('Negative values are not permitted.');

    const updatedAccount = await accountsModel.findByIdAndUpdate(
      accountExists.id,
      { balance: accountExists.balance + valor },
      { new: true }
    );

    return res.json(updatedAccount);
  } catch (error) {
    res.status(500).send(error);
  }
});

//Update Accounts - withdraw
app.patch('/accounts/withdraw', async (req, res) => {
  try {
    const { agencia, conta, valor } = req.body;

    const accountExists = await accountsModel.findOne({ agencia, conta });

    if (!accountExists) {
      res.send('Error');
    }

    if (valor < 0) throw new Error('Negative values are not permitted.');
    if (accountExists.balance < 0) throw new Error('Withdraw not permitted.');

    const updatedAccount = await accountsModel.findByIdAndUpdate(
      accountExists.id,
      { balance: accountExists.balance - valor - 1 },
      { new: true }
    );

    return res.json(updatedAccount);
  } catch (error) {
    res.status(500).send(error);
  }
});

//Consultar Saldo
app.get('/accounts/balance', async (req, res) => {
  try {
    const { agencia, conta } = req.body;
    const accountExists = await accountsModel.findOne({ agencia, conta });

    if (!accountExists) {
      res.status(500).send('Error');
    }

    return res.json({ balance: accountExists.balance });
  } catch (error) {}
});

//Delete Account
app.delete('/accounts/delete', async (req, res) => {
  try {
    const { agencia, conta } = req.body;
    const accountDelete = await accountsModel.findOne({
      agencia,
      conta,
    });

    const agencyCount = await accountsModel.findByIdAndDelete(
      accountDelete.id,
      { agencia, conta }
    );

    const allAcountsAgency = await accountsModel.countDocuments({ agencia });

    if (!agencyCount) {
      res.status(404).send('Account not found');
    } else {
      return res.json(allAcountsAgency);
    }
  } catch (error) {
    res.status(500).send(error);
  }
});

//Transfer Accounts
app.patch('/accounts/transfer', async (req, res) => {
  try {
    const { originAccount, targetAccount, valor } = req.body;

    const firstAccount = await accountsModel.findOne({ conta: originAccount });
    const secondAccount = await accountsModel.findOne({ conta: targetAccount });

    if (firstAccount.agencia === secondAccount.agencia) {
      const balanceOriginAccount = await accountsModel.findByIdAndUpdate(
        firstAccount.id,
        {
          balance: firstAccount.balance - valor,
        },
        { new: true }
      );
      await accountsModel.findByIdAndUpdate(
        secondAccount.id,
        {
          balance: secondAccount.balance + valor,
        },
        { new: true }
      );
      return res.json({ balance: balanceOriginAccount.balance });
    } else {
      const balanceOriginAccount = await accountsModel.findByIdAndUpdate(
        firstAccount.id,
        {
          balance: firstAccount.balance - (valor + 8),
        },
        { new: true }
      );

      await accountsModel.findByIdAndUpdate(
        secondAccount.id,
        {
          balance: secondAccount.balance + valor,
        },
        { new: true }
      );
      return res.json({ balance: balanceOriginAccount.balance });
    }
  } catch (error) {}
});

//Average Balance Agencies
app.get('/accounts/average', async (req, res) => {
  try {
    const { agencia } = req.body;

    const agencies = await accountsModel.find({ agencia });

    if (!agencies) {
      res.status(500).send('Error');
    }

    const totalBalance = agencies.reduce((accumulator, { balance }) => {
      accumulator += balance;
      return accumulator;
    }, 0);

    const averageBalance = totalBalance / agencies.length;

    return res.json(Number(averageBalance.toFixed(2)));
  } catch (error) {}
});

//Lowest Balance
app.get('/accounts/lowestBalance', async (req, res) => {
  try {
    const { countAccounts } = req.body;

    const showAccounts = await accountsModel
      .find()
      .sort({ balance: 1, name: 1 })
      .limit(countAccounts);

    return res.json(showAccounts);
  } catch (error) {}
});

//Highest Balance
app.get('/accounts/highestBalance', async (req, res) => {
  try {
    const { countAccounts } = req.body;

    const showAccounts = await accountsModel
      .find()
      .sort({ balance: -1, name: 1 })
      .limit(countAccounts);

    return res.json(showAccounts);
  } catch (error) {}
});

//Private Agency (99)
app.get('/accounts/privateAgency', async (req, res) => {
  const accounts = await accountsModel.find();

  const agencies = Array.from(
    new Set(
      accounts.map((account) => {
        return account.agencia;
      })
    )
  );

  const accountsToReturn = [];
  for (const agency of agencies) {
    const agencyAccount = await accountsModel
      .find({ agencia: agency })
      .sort({ balance: -1 })
      .limit(1);

    const updatedAccount = await accountsModel.findByIdAndUpdate(
      agencyAccount[0].id,
      { agencia: 99 },
      { new: true }
    );

    accountsToReturn.push(updatedAccount);
  }

  return res.json(accountsToReturn);
});

export { app as accountsRouter };
