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

//Get Accounts
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
    const { agency, account, value } = req.body;

    const accountExists = await accountsModel.findOne({
      agencia: agency,
      conta: account,
    });

    if (!accountExists) {
      res.status(404).send('Account not found');
    }

    if (value < 0) res.status(500).send('Negative values are not permitted.');

    const updatedAccount = await accountsModel.findByIdAndUpdate(
      accountExists.id,
      { balance: accountExists.balance + value },
      { new: true }
    );
    await updatedAccount.save();
    res.send({ balance: updatedAccount.balance });
  } catch (error) {
    res.status(500).send(error);
  }
});

//Update Accounts - withdraw
app.patch('/accounts/withdraw', async (req, res) => {
  try {
    const { agency, account, value } = req.body;

    const accountExists = await accountsModel.findOne({
      agencia: agency,
      conta: account,
    });

    if (!accountExists) {
      res.status(404).send('Account not found');
    }

    if (value < 0) res.status(404).send('Negative values are not permitted.');

    if (value > accountExists.balance || accountExists.balance < 0) {
      res
        .status(404)
        .send('Withdraw not permitted, negative balance are not permitted.');
    } else {
      const updatedAccount = await accountsModel.findByIdAndUpdate(
        accountExists.id,
        { balance: accountExists.balance - (value + 1) },
        { new: true }
      );

      await updatedAccount.save();

      res.send({ balance: updatedAccount.balance });
    }
  } catch (error) {
    res.status(500).send(error);
  }
});

//Balance Inquiry
app.get('/accounts/balance', async (req, res) => {
  try {
    const { agency, account } = req.body;

    const accountExists = await accountsModel.findOne({
      agencia: agency,
      conta: account,
    });

    if (!accountExists) {
      res.status(404).send('Account not found.');
    }
    res.send({ balance: accountExists.balance });
  } catch (error) {
    res.status(500).send(error);
  }
});

//Delete Account
app.delete('/accounts/delete', async (req, res) => {
  try {
    const { agency, account } = req.body;

    const accountDelete = await accountsModel.findOne({
      agencia: agency,
      conta: account,
    });

    const agencyCount = await accountsModel.findByIdAndDelete(
      accountDelete.id,
      { agencia: agency, conta: account }
    );

    const allAcountsAgency = await accountsModel.countDocuments({
      agencia: agency,
    });

    if (!agencyCount) {
      res.status(404).send('Agency not found');
    } else {
      res.send({ allAcountsAgency });
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

    //Check Equal Agencies
    if (firstAccount.agencia === secondAccount.agencia) {
      const balanceOriginAccount = await accountsModel.findByIdAndUpdate(
        firstAccount.id,
        {
          balance: firstAccount.balance - valor,
        },
        { new: true }
      );

      //Search Agency by Id and Update Balance
      await accountsModel.findByIdAndUpdate(
        secondAccount.id,
        {
          balance: secondAccount.balance + valor,
        },
        { new: true }
      );

      res.send({ balance: balanceOriginAccount.balance });
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
      res.send({ balance: balanceOriginAccount.balance });
    }
  } catch (error) {
    res.status(500).send(error);
  }
});

//Average Balance Agencies
app.get('/accounts/average', async (req, res) => {
  try {
    const { agency } = req.body;

    const agencies = await accountsModel.find({ agencia: agency });

    if (!agencies) {
      res.status(500).send('Agency not found');
    } else {
      const totalBalance = agencies.reduce((accumulator, { balance }) => {
        accumulator += balance;
        return accumulator;
      }, 0);

      const averageBalance = Number(
        (totalBalance / agencies.length).toFixed(2)
      );

      res.send({ averageBalance });
    }
  } catch (error) {
    res.status(500).send(error);
  }
});

//Lowest Balance
app.get('/accounts/lowestBalance', async (req, res) => {
  try {
    const { countAccounts } = req.body;

    const showAccounts = await accountsModel
      .find()
      .sort({ balance: 1, name: 1 })
      .limit(countAccounts);

    res.send(showAccounts);
  } catch (error) {
    res.status(500).send(error);
  }
});

//Highest Balance
app.get('/accounts/highestBalance', async (req, res) => {
  try {
    const { countAccounts } = req.body;

    const showAccounts = await accountsModel
      .find()
      .sort({ balance: -1, name: 1 })
      .limit(countAccounts);

    res.send(showAccounts);
  } catch (error) {
    res.status(500).send(error);
  }
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

  res.send(accountsToReturn);
});

export { app as accountsRouter };
