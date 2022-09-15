import dotenv from 'dotenv';
dotenv.config();

import * as cheerio from 'cheerio';

import axios from 'axios';
import querystring from 'querystring';
import { stringify } from 'csv-stringify';

import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import { sleep } from './utils.js';

import fs from 'fs';

const config = {
  startId: 2019,
  endId: 2208,
  baseURL: 'http://sofi.virtualfri.id',
};

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
    const data = {};

    rows.each((index, row) => {
      if (index === 0) return true;
      const tds = $(row).find('td');
      const name = $(tds[0]).text().trim();

      const valueElement = $(tds[2]);
      let value = '';

      const childElement = valueElement.children().first();

      // console.log(childElement.prop('tagName'));

      switch (childElement.prop('tagName')) {
        case 'A':
          value = $(childElement).attr('href');
          break;
        case 'P':
          value = valueElement
            .text()
            .trim()
            .split('\n')
            .map(
              (val) =>
                val
                  // .replace(/([a-zA-Z ])/g, '')
                  .trim(),
              // .split(':')[1],
            );
          break;
        default:
          value = valueElement.text().trim();
      }

      Object.assign(data, { [name.toLowerCase().replace(' ', '_')]: value });
    });
    return { id, data };
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

    for (let id = config.startId; id < config.endId; id++) {
      const sidang = await fetchSidang(id);
      if (sidang) {
        sidangs.push(sidang);
        sleep(1000);
      }
    }

    stringify(sidangs, { columns: Object.keys(sidangs[0]) }, (err, data) => {
      fs.writeFileSync(
        'out.csv',
        Object.keys(sidangs[0]).join(',') + '\n' + data,
      );
    });
  } catch (err) {
    console.log(err);
  }
})();
