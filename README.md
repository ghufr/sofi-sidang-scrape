# Sofi Sidang Scrape

A script to scrape sidang from `sofi.virtualfri.id`

## Usage

1. Copy `.env.example` to `.env`
2. Fill SSO `username` and `password` in `.env`
3. Open `src/config.js` and configure `startId` and `endId`
4. in project directory, `npm run start`
5. the result will be in `out.csv`

## Limitation

1. You'll need an SSO account.
2. Cannot get sidang's schedule, since the APP limit who can see the schedule.
3. Cannot download document file automatically (only the url).
