import 'dotenv/config';
import puppeteer from 'puppeteer';
import { white } from 'chalk';
import { subDays, getDay, format } from 'date-fns';
import schedule from '../schedule';
import { clearInput, isEmpty } from './helpers';

if (isEmpty(process.env.ALTAI_USER) || isEmpty(process.env.ALTAI_PASSWORD) || isEmpty(process.env.ALTAI_URL)) {
  console.log(white.bgRed('Error: Enviorment variables missing'));
  process.exit();
}

const params = process.argv;
const date = params[2] === '-1' ? subDays(new Date(), 1) : new Date();
const weekDay = getDay(date);
const formattedDate = format(date, 'DD/MM/YYYY');

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
    await page.waitForSelector('#cpContenidoCentral_lnkbtnNuevoRegistro');
    await page.click('#cpContenidoCentral_lnkbtnNuevoRegistro');
    await page.waitForNavigation();
    await page.waitForSelector('#cpContenidoCentral_loIncFichaActividad_cmbActividad');
    await page.select('#cpContenidoCentral_loIncFichaActividad_cmbActividad', '8326');
    await page.evaluate(
      formattedDate =>
        (document.querySelector('#cpContenidoCentral_loIncFichaActividad_txFechaInicio').value = formattedDate),
      formattedDate
    );
    await clearInput(page, '#cpContenidoCentral_loIncFichaActividad_txHoraInicio');
    await page.type('#cpContenidoCentral_loIncFichaActividad_txHoraInicio', schedule[weekDay].from);
    await page.evaluate(
      formattedDate =>
        (document.querySelector('#cpContenidoCentral_loIncFichaActividad_txFechaFin').value = formattedDate),
      formattedDate
    );
    await clearInput(page, '#cpContenidoCentral_loIncFichaActividad_txHoraFin');
    await page.type('#cpContenidoCentral_loIncFichaActividad_txHoraFin', schedule[weekDay].to);
    await page.type('#cpContenidoCentral_loIncFichaActividad_txDescripcion', '¯\\_(ツ)_/¯');
    await page.click('#cpContenidoCentral_loIncFichaActividad_btnGrabar');
    await page.waitFor('.profile-usertitle-job');
    const hasError = await page.$('#ui_notifIt');
    if (hasError !== null) {
      const error = await hasError.$eval('div.dvAvisoCuerpoCenter', el => el.textContent);
      throw new Error(error);
    }
    console.log('done!');
  } catch (e) {
    console.error(e);
  } finally {
    await browser.close();
  }
})();
