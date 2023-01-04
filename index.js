require("dotenv").config();

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

const { default: axios } = require("axios");
const express = require("express");
const app = express();
const querystring = require("querystring");

function makeid(length) {
  var result = "";
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

app.get("/login", (req, res) => {
  try {
    var state = makeid(16);
    var scope =
      "streaming user-read-email user-read-private user-library-read user-library-modify user-read-playback-state user-modify-playback-state";

    res.redirect(
      "https://accounts.spotify.com/authorize?" +
        querystring.stringify({
          response_type: "code",
          client_id: CLIENT_ID,
          scope: scope,
          redirect_uri: REDIRECT_URI,
          state: state,
        })
    );
  } catch (e) {
    console.log(e.message);
  }
});

app.get("/callback", (req, res) => {
  const code = req.query.code || null;
  console.log(code);
  axios({
    method: "POST",
    url: "https://accounts.spotify.com/api/token",
    params: {
      grant_type: "authorization_code",
      code: code,
      redirect_uri: REDIRECT_URI,
    },
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${new Buffer.from(
        `${CLIENT_ID}:${CLIENT_SECRET}`
      ).toString("base64")}`,
    },
  })
    .then((response) => {
      if (response.status === 200) {
        const params = querystring.stringify({
          access_token: response.data.access_token,
          created_at: Date.now(),
          refresh_token: response.data.refresh_token,
        });
        res.redirect(`http://localhost:5173/main-page?${params}`);
      } else {
        res.send(response);
      }
    })
    .catch((error) => {
      res.send(error);
    });
});

app.get("/refresh_token", (req, res) => {
  const { refresh_token } = req.query;
  axios({
    method: "post",
    url: "https://accounts.spotify.com/api/token",
    data: querystring.stringify({
      grant_type: "refresh_token",
      refresh_token: refresh_token,
    }),
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${new Buffer.from(
        `${CLIENT_ID}:${CLIENT_SECRET}`
      ).toString("base64")}`,
    },
  })
    .then((response) => {
      const params = querystring.stringify({
        access_token: response.data.access_token,
        created_at: Date.now(),
      });
      res.redirect(`http://localhost:5173/main-page?${params}`);
    })
    .catch((error) => {
      res.send(error);
    });
});

const port = 3000;
app.listen(port, () => {
  console.log(`Express app listening at http://localhost:${port}`);
});
