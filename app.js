const express = require('express');
const path = require('path');
const ejs = require('ejs');
const paypal = require('paypal-rest-sdk');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(process.cwd(), '.env') })
paypal.configure({
  'mode': 'sandbox', //sandbox or live
  'client_id': process.env.CLIENT_ID,
  'client_secret': process.env.CLIENT_SECRET
});

const app = express();

app.set('view engine', 'ejs');

app.get('/', (req, res) => res.render('index'));

app.post('/pay', (req, res) => {
  const create_payment_json = {
    "intent": "sale",
    "payer": {
        "payment_method": "paypal"
    },
    "redirect_urls": {
        "return_url": "http://localhost:5000/success",
        "cancel_url": "http://localhost:5000/cancel"
    },
    "transactions": [{
        "item_list": {
            "items": [{
                "name": "Gibson Guitar",
                "sku": "012",
                "price": "200.00",
                "currency": "USD",
                "quantity": 1
            }]
        },
        "amount": {
            "currency": "USD",
            "total": "200.00"
        },
        "description": "Best guitar ever."
    }]
  };


  paypal.payment.create(create_payment_json, function (error, payment) {
      if (error) {
          throw error;
      } else {
          for(let i = 0; i< payment.links.length; i++) {
            if (payment.links[i].rel === 'approval_url') {
              res.redirect(payment.links[i].href)
            }
          }
      }
  });
});

app.get('/success', (req, res) => {
  const payerId = req.query.PayerID;
  const paymentId = req.query.paymentId;

  const execute_payment_json = {
    "payer_id": payerId,
    "transactions": [{
      "amount": {
        "currency": "USD",
        "total": "200.00"
      }
    }]
  }

  paypal.payment.execute(paymentId, execute_payment_json, function(error, payment) {
    if (error) {
      console.log(error.response);
    } else {
      console.log(JSON.stringify(payment))
      res.send('success')
    }
  });
})


app.get('/cancel', (req, res) => {
  res.send('canceled')
})

app.listen(5000, () => console.log('server started'));