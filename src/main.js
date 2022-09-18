import dotenv from 'dotenv';
dotenv.config();

import * as cheerio from 'cheerio';

import fs from 'fs';
import axios from 'axios';
import querystring from 'querystring';
import { stringify } from 'csv-stringify';

import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import { sleep } from './utils.js';

import normalize from './normalize.js';
import denormalize from './denormalize.js';
import config from './config.js';

const jar = new CookieJar();

const client = wrapper(
  axios.create({
    jar,
    withCredentials: true,
    baseURL: config.baseURL,
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36',
      Origin: config.baseURL,
      Accept: '*/*',
    },
  }),
);

const loginSSO = async () => {
  const res = await client.get('loginSSO', { jar });
  const $ = cheerio.load(res.data);
  return {
    csrfToken: $('input[name=_token]').attr('value'),
  };
};

const checkLoginSSO = async ({ username, password, token, cookie }) => {
  const data = querystring.stringify({
    _token: token,
    username,
    password,
  });
  await client.post('/checkloginSSO', data, { jar }).catch((err) => {
    throw new Error('Invalid Credentials');
  });
};

const fetchSidang = async (id) => {
  try {
    const res = await client.get(`/sidangs/${id}`, { jar });
    const $ = cheerio.load(res.data);
    const tables = $('table');
    $(tables[0]).attr('id', 'data-table');

    const rows = $('#data-table > tbody > tr');
    let data = {};

    rows.each((index, row) => {
      const tds = $(row).find('td');
      const name = $(tds[0]).text().trim();

      const valueElement = $(tds[2]);
      let value = '';

      const childElement = valueElement.children().first();

      switch (childElement.prop('tagName')) {
        case 'A':
          value = $(childElement).attr('href');
          break;
        default:
          value = valueElement.text().trim();
      }

      const key = name.toLowerCase().replace(' ', '_');
      const transformedValue = normalize.transform(key, value);
      data = { ...data, ...transformedValue };
    });
    return { id, ...data };
  } catch (err) {
    return null;
  }
};

(async () => {
  try {
    const { csrfToken } = await loginSSO();

    await checkLoginSSO({
      username: process.env.USERNAME_SSO,
      password: process.env.PASSWORD_SSO,
      token: csrfToken,
    });

    const sidangs = [];
    let columns = [];

    for (let id = config.startId; id < config.endId; id++) {
      const sidang = await fetchSidang(id);

      if (!sidang) continue;
      sidangs.push(denormalize.transform(sidang));
      sleep(config.delay);
    }

    columns = Object.keys(sidangs[0] || {});
    stringify(sidangs, { columns }, (err, data) => {
      if (err) return;
      fs.writeFileSync('out.csv', columns.join(',') + '\n' + data);
    });
  } catch (err) {
    console.log(err);
  }
})();
