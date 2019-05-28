import 'dotenv/config';
import puppeteer from 'puppeteer';
import { format, subMonths } from 'date-fns';

if (isEmpty(process.env.ALTAI_USER) || isEmpty(process.env.ALTAI_PASSWORD) || isEmpty(process.env.ALTAI_URL)) {
  console.log(white.bgRed('Error: Enviorment variables missing'));
  process.exit();
}

(async () => {
  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(process.env.ALTAI_URL);
    await page.type('#txLoginUsuario', process.env.ALTAI_USER);
    await page.type('#txLoginContrasena', process.env.ALTAI_PASSWORD);
    await page.click('#btnLogin');
    // Check if the login went succesfull
    if ((await page.$('.navbar-brand')) === null) {
      throw new Error('User or Password incorrect');
    }
    await page.click('a[href="ListActividad.aspx"');
    await page.evaluate(
      ({ from, to }) => {
        document.querySelector('#ctl00$cpContenidoCentral$txFechaDesde').value = from;
        document.querySelector('#ctl00$cpContenidoCentral$txFechaHasta').value = to;
      },
      {
        from: format(subMonths(new Date(), 1), 'DD/MM/YYYY'),
        to: format(new Date(), 'DD/MM/YYYY')
      }
    );
    await page.click('#cpContenidoCentral_linkbtnBuscar');
  } catch (e) {
    console.error(e);
  } finally {
    await browser.close();
  }
})();
