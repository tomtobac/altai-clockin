import 'dotenv/config';
import puppeteer from 'puppeteer';
import { format, subMonths, eachDay, isWeekend } from 'date-fns';
import { isEmpty } from './helpers';
const DATE_FORMAT = 'YYYY-MM-DD';

if (isEmpty(process.env.ALTAI_USER) || isEmpty(process.env.ALTAI_PASSWORD) || isEmpty(process.env.ALTAI_URL)) {
  console.log(white.bgRed('Error: Enviorment variables missing'));
  process.exit();
}

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  try {
    await page.goto(process.env.ALTAI_URL);
    await page.type('#txLoginUsuario', process.env.ALTAI_USER);
    await page.type('#txLoginContrasena', process.env.ALTAI_PASSWORD);
    await page.click('#btnLogin');
    await page.waitFor(500);
    // Check if the login went succesfull
    if ((await page.$('.navbar-brand')) === null) {
      console.log(x);
      throw new Error('User or Password incorrect');
    }
    await page.click('.menu-toggler');
    await page.click('a[href="ListActividad.aspx"');
    await page.waitForSelector('#cpContenidoCentral_txFechaDesde');
    await page.evaluate(
      ({ from, to }) => {
        document.querySelector('#cpContenidoCentral_txFechaDesde').value = from;
        document.querySelector('#cpContenidoCentral_txFechaHasta').value = to;
      },
      {
        from: format(subMonths(new Date(), 1), 'DD/MM/YYYY'),
        to: format(new Date(), 'DD/MM/YYYY')
      }
    );
    await page.click('#cpContenidoCentral_linkbtnBuscar');
    await page.waitFor(500);
    const records = await page.evaluate(() => {
      const tbody = document.querySelector('tbody');
      const rows = Array.from(tbody.querySelectorAll('tr'));
      return rows.map(row => {
        const { children } = row;
        if (row.classList.contains('trAmarillo')) {
          // Holidays!
          return {
            date: children[4].textContent.trim(),
            activity: children[2].textContent.trim(),
            from: children[10].textContent.trim(),
            to: children[11].textContent.trim(),
            total: ''
          };
        } else {
          // Working
          return {
            date: children[4].textContent.trim(),
            activity: children[2].textContent.trim(),
            from: children[5].textContent.trim(),
            to: children[6].textContent.trim(),
            total: children[7].textContent.trim()
          };
        }
      });
    });
    const range = eachDay(getDateFromRecord(records[0]), new Date());
    const calendar = range
      .filter(date => !isWeekend(date))
      .reduce((prev, curr) => {
        prev[format(curr, DATE_FORMAT)] = {
          date: null,
          activity: null,
          from: null,
          to: null,
          total: null
        };
        return prev;
      }, {});
    records.forEach(record => {
      const date = getDateFromRecord(record);
      calendar[format(date, DATE_FORMAT)] = record;
    });
    console.table(calendar);
  } catch (e) {
    console.error(e);
  } finally {
    await browser.close();
  }
})();

const getDateFromRecord = str => {
  const [day, month, year] = str.date.split(' ')[0].split('/');
  return new Date(`${year}-${month}-${day}`);
};
