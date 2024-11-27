const { connect } = require("puppeteer-real-browser")
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

// const LTA_TRANSFER_URL = 'https://onemotoring.lta.gov.sg/content/onemotoring/home/digitalservices/Enquire_Vehicle_Transfer_Fee.html';
// const LTA_ROADTAX_URL = 'https://onemotoring.lta.gov.sg/content/onemotoring/home/digitalservices/Enquire-Road-Tax-Payable-Prerequisites.html';
const LTA_REBATE_URL = 'https://vrl.lta.gov.sg/lta/vrl/action/pubfunc?ID=EnquireRebateBeforeDeReg';
const LTA_TRANSFER_URL = 'https://vrl.lta.gov.sg/lta/vrl/action/pubfunc?ID=EnquireTransferFee'
const LTA_ROADTAX_URL = 'https://vrl.lta.gov.sg/lta/vrl/action/pubfunc?ID=EnquireRoadTaxPayable';

var PROXY_ENABLED = false;


const prbOptions = {
    headless: false,
    args: [],
    customConfig: {},
    turnstile: false,
    disableXvfb: false,
    ignoreAllFlags: false,
    connectOption: {
        defaultViewport: null
    },
}

if (PROXY_ENABLED) {
    prbOptions.proxy = {
        host:'af0f6cc9cff9c588.wpu.as.pyproxy.io',
        port:'16666',
        username:'caarlyx01-zone-resi-region-sg',
        password:'asdQWE123',
    }
    // prbOptions.proxy = {
    //     host:'af0f6cc9cff9c588.wpu.as.pyproxy.io',
    //     port:'16666',
    //     username:'caarlyx01-zone-resi-region-rsa',
    //     password:'asdQWE123',
    // }
}

async function getRebateInfo(data) {
    // const uuid = uuidv4();
    // const userDataDir = `${__dirname}/userdatadir/${uuid}`;
    // fs.cpSync(`${__dirname}/userdatatemplates/rebate`, userDataDir, {recursive: true});
    // prbOptions.args = [`--user-data-dir=${userDataDir}`, `--hide-crash-restore-bubble`];

    console.log(`[${data.license_plate}] opening browser for rebate..`);
    const { browser, page } = await connect(prbOptions);

    try {
        console.log(`[${data.license_plate}] opening page for rebate..`);
        await page.goto(LTA_REBATE_URL, { waitUntil: "networkidle0", timeout: 30000 });
        await sleep(500);

        console.log(`[${data.license_plate}] filling in info for rebate..`);
        
        await page.click('input[name=vehicleNo][type=text]');
        await sleep(500);
        await page.type('input[name=vehicleNo][type=text]', data.license_plate, { delay: getRandomInt(100,200) });
        await sleep(500);

        await page.select('select[name=ownerIdType]', data.owner_id_type);
        await sleep(500);
        
        await page.click('input[name=ownerId][type=text]');
        await sleep(500);
        await page.type('input[name=ownerId][type=text]', data.owner_id, { delay: getRandomInt(200,300) });
        await sleep(500);

        await page.click('input[name=intendedDeRegDate][type=text]');
        await sleep(500);
        await page.type('input[name=intendedDeRegDate][type=text]', data.intended_transfer_date, { delay: getRandomInt(100,200) });
        await sleep(500);
        await page.click('input[name=intendedDeRegDate][type=text]', {offset: {x: 300, y: 20}});
        await sleep(500);

        await page.$eval('#button', (element, value) => {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
        await sleep(500);
        await page.click('input[name=agreeTC][type=checkbox]');
        await sleep(500);

        console.log(`[${data.license_plate}] submitting form for rebate..`);
        await page.click('#button', {delay: getRandomInt(200,400)});
        await page.waitForNavigation();
        await sleep(500);

        //Check for recaptcha error for retry
        var recaptchaError = await page.evaluate(() => {
            var errXpath = `//td[@class='errorTxtRedBold12pt']/ul/li`;
            var element = document.evaluate(errXpath, document).iterateNext();
            if (element) {
                console.log(element);
                var errorMessage = element.innerText;
                if (errorMessage.includes('CM00149')) {
                    return true
                }
                return false
            }
        });

        if (recaptchaError) {
            console.log(`[${data.license_plate}] refilling in info for rebate ..`);

            await sleep(1000);

            await page.$eval('#button', (element, value) => {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            });
            await sleep(1000);

            await page.click('input[name=agreeTC][type=checkbox]');
            await sleep(1000);

            console.log(`[${data.license_plate}] resubmitting form for rebate..`);
            await page.click('#button');
            await page.waitForNavigation();
        }
        
        console.log(`[${data.license_plate}] extracting info for rebate ..`);

        const fields = [ // accurate as of 30 May 2023
            {name: "owner_id_type", selector: 'Owner ID Type'},
            {name: "owner_id", selector: 'Owner ID'},
            {name: "license_plate", selector: 'Vehicle No.'},
            {name: "motor_number", selector: 'Motor No.'},
            {name: "vehicle_to_be_exported", selector: 'Vehicle to be Exported'},
            {name: "intended_dereg_date", selector: 'Intended Deregistration Date'},
            {name: "vehicle_make", selector: 'Vehicle Make'},
            {name: "vehicle_model", selector: 'Vehicle Model'},
            {name: "primary_colour", selector: 'Primary Colour'},
            {name: "manufacturing_year", selector: 'Manufacturing Year'},
            {name: "engine_number", selector: 'Engine No.'},
            {name: "chassis_number", selector: 'Chassis No.'},
            {name: "max_power_output", selector: 'Maximum Power Output', postProcess: (value) => value.replace(/[\n\r\t ]/g, "").replace(/\u00a0/g, " ")},
            {name: "open_market_value", selector: 'Open Market Value'},
            {name: "orig_reg_date", selector: 'Original Registration Date'},
            {name: "first_reg_date", selector: 'First Registration Date'},
            {name: "transfer_count", selector: 'Transfer Count'},
            {name: "actual_arf_paid", selector: 'Actual ARF Paid'},
            {name: "parf_eligibility", selector: 'PARF Eligibility'},
            {name: "parf_eligibility_expiry_date", selector: 'PARF Eligibility Expiry Date'},
            {name: "parf_rebate_amount", selector: 'PARF Rebate Amount'},
            {name: "coe_expiry_date", selector: 'COE Expiry Date'},
            {name: "coe_category", selector: 'COE Category'},
            {name: "coe_period", selector: 'COE Period(Years)'},
            {name: "coe_qp_paid", selector: 'QP Paid'},
            {name: "coe_pqp_paid", selector: 'PQP Paid'},
            {name: "coe_rebate_amount", selector: 'COE Rebate Amount'},
            {name: "total_rebate_amount", xpath: `//label[@class='text-label' and contains(b, 'Total Rebate Amount')]/parent::div/following-sibling::div/p[@class='form-control-static']`},
            {name: "opc_cash_rebate_eligibility", selector: 'OPC Cash Rebate Eligibility'},
            {name: "opc_cash_rebate_eligibility_expiry_date", selector: 'OPC Cash Rebate Eligibility Expiry Date'},
            {name: "opc_cash_rebate_amount", selector: 'OPC Cash Rebate Amount'}
        ];

        var vehicle = await page.evaluate((fields) => {

            var errXpath = `//td[@class='errorTxtRedBold12pt']/ul/li`;
            var element = document.evaluate(errXpath, document).iterateNext();
            if (element) {
                console.log(element);
                return Promise.reject(element.innerText);
            }

            var vehicle = {};
            Promise.all(fields.map(async (field) => {
                // //label[@class='text-label' and contains(text(), 'Owner ID Type')]/parent::div/following-sibling::div/p[@class='form-control-static']
                if (field.selector) {
                    var xpath = `//label[@class='text-label' and text()='${field.selector}']/parent::div/following-sibling::div/p[@class='form-control-static']`;
                    var element = document.evaluate(xpath, document).iterateNext();
                    vehicle[field.name] = element.innerText;
                }
                else {
                    var element = document.evaluate(field.xpath, document).iterateNext();
                    vehicle[field.name] = element.innerText;
                }
            }));
            return vehicle;
        }, fields).catch((error) => {
            browser.close();
            // fs.rmSync(userDataDir, {recursive: true});
            return Promise.reject(error);
        })

        fields.map((field) => {
            if (field.postProcess) {
                vehicle[field.name] = field.postProcess(vehicle[field.name]);
            }
        });

        console.log(vehicle);
        console.log(`[${data.license_plate}] rebate done`);
        await browser.close();
        // fs.rmSync(userDataDir, {recursive: true});
        return vehicle;
    } catch (error) {
        await browser.close();
        // fs.rmSync(userDataDir, {recursive: true});
        return Promise.reject(error);
    }
}
exports.getRebateInfo = getRebateInfo;

async function getTransferInfo(data) {
    // const uuid = uuidv4();
    // const userDataDir = `${__dirname}/userdatadir/${uuid}`;
    // fs.cpSync(`${__dirname}/userdatatemplates/transfer`, userDataDir, {recursive: true});
    // prbOptions.args = [`--user-data-dir=${userDataDir}`, `--hide-crash-restore-bubble`];

    console.log(`[${data.license_plate}] opening browser for transfer ..`);
    const { browser, page } = await connect(prbOptions);

    try {
        console.log(`[${data.license_plate}] opening page for transfer ..`);
        await page.goto(LTA_TRANSFER_URL, { waitUntil: "networkidle0", timeout: 30000 });
        await sleep(500);

        console.log(`[${data.license_plate}] filling in info for transfer ..`);
        
        await page.select('#ownerIdTypeCd', data.owner_id_type);
        await sleep(500);

        await page.click('#ownerId');
        await sleep(500);
        await page.type('#ownerId', data.owner_id, { delay: getRandomInt(100,200) });
        await sleep(500);

        await page.click('#vehicleNo');
        await sleep(500);
        await page.type('#vehicleNo', data.license_plate, { delay: getRandomInt(200,300) });
        await sleep(500);

        await page.click('#transferDate');
        await sleep(500);
        await page.type('#transferDate', data.intended_transfer_date, { delay: getRandomInt(100,200) });
        await sleep(500);
        await page.click('#transferDate', {offset: {x: 400, y: 20}});
        await sleep(500);
        
        await page.click('#agreeTCbox');
        await sleep(500);

        await page.$eval('#btnSubmit', (element, value) => {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
        await sleep(500);

        console.log(`[${data.license_plate}] submitting form for transfer ..`);
        await page.click('#btnSubmit');
        await page.waitForNavigation();
        await sleep(500);

        //Check for recaptcha error for retry
        var recaptchaError = await page.evaluate(() => {
            var errXpath = `//td[@class='errorTxtRedBold12pt']/ul/li`;
            var element = document.evaluate(errXpath, document).iterateNext();
            if (element) {
                console.log(element);
                var errorMessage = element.innerText;
                if (errorMessage.includes('CM00149')) {
                    return true
                }
                return false
            }
        });

        if (recaptchaError) {
            console.log(`[${data.license_plate}] refilling in info for transfer ..`);

            await sleep(1000);

            await page.click('#transferDate');
            await sleep(500);
            await page.type('#transferDate', data.intended_transfer_date, { delay: getRandomInt(100,200) });
            await sleep(500);
            await page.click('#transferDate', {offset: {x: 300, y: 20}});
            await sleep(500);

            await page.click('#agreeTCbox');
            await sleep(500);

            await page.$eval('#btnSubmit', (element, value) => {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            });
            await sleep(500);

            console.log(`[${data.license_plate}] resubmitting form for transfer ..`);
            await page.click('#btnSubmit');
            await page.waitForNavigation();
        }

        console.log(`[${data.license_plate}] extracting info for transfer..`);

        const fields = [ // accurate as of 30 May 2023
            {name: "license_plate"},
            {name: "vehicle_make"},
            {name: "vehicle_model"},
            {name: "vehicle_type", selector: 'Vehicle Type'},
            {name: "vehicle_scheme", selector: 'Vehicle Scheme'},
            {name: "propellant", selector: 'Propellant'},
            {name: "motor_number", selector: 'Motor No.'},
            {name: "power_rating", selector: 'Power Rating'},
            {name: "max_laden_weight", selector: 'Maximum Laden Weight', postProcess: (value) => value.replace(/[\n\r\t ]/g, "").replace(/\u00a0/g, " ")},
            {name: "manufacturing_year", selector: 'Year Of Manufacture'},
            {name: "lifespan_expiry_date", selector: 'Lifespan Expiry Date'},
            {name: "coe_qp_paid", selector: 'Quota Premium'},
            {name: "coe_pqp_paid", selector: 'PQP Paid'},
            {name: "road_tax_expiry_date", selector: 'Road Tax Expiry Date'},
            {name: "inspection_due_date", selector: 'Inspection Due Date'},
            {name: "co2_emission", selector: 'CO2 Emission', postProcess: (value) => value.replace(/[\n\r\t ]/g, "").replace(/\u00a0/g, " ")},
            {name: "nox_emission", selector: 'NOx Emission', postProcess: (value) => value.replace(/[\n\r\t ]/g, "").replace(/\u00a0/g, " ")},
            {name: "vehicle_attachment_1", selector: 'Vehicle Attachment 1'},
            {name: "chassis_number", selector: 'Chassis No.'},
            {name: "engine_number", selector: 'Engine No.'},
            {name: "engine_capacity", selector: 'Engine Capacity', postProcess: (value) => value.replace(/[\n\r\t ]/g, "").replace(/\u00a0/g, " ")},
            {name: "max_power_output", selector: 'Maximum Power Output', postProcess: (value) => value.replace(/[\n\r\t ]/g, "").replace(/\u00a0/g, " ")},
            {name: "unladen_weight", selector: 'Unladen Weight', postProcess: (value) => value.replace(/[\n\r\t ]/g, "").replace(/\u00a0/g, " ")},
            {name: "orig_reg_date", selector: 'Original Registration Date'},
            {name: "coe_category", selector: 'COE Category'},
            {name: "coe_expiry_date", selector: 'COE Expiry Date'},
            {name: "parf_eligibility_expiry_date", selector: 'PARF Eligibility Expiry Date'},
            {name: "intended_transfer_date", selector: 'Intended Transfer Date'},
            {name: "cevs_ves_rebate_utilised_amount", selector: 'CEV/VES Rebate Utilised Amount'},
            {name: "hc_emission", selector: 'HC Emission', postProcess: (value) => value.replace(/[\n\r\t ]/g, "").replace(/\u00a0/g, " ")},
            {name: "pm_emission", selector: 'PM Emission', postProcess: (value) => value.replace(/[\n\r\t ]/g, "").replace(/\u00a0/g, " ")}
        ];

        var vehicle = await page.evaluate((fields) => {

            var errXpath = `//td[@class='errorTxtRedBold12pt']/ul/li`;
            var element = document.evaluate(errXpath, document).iterateNext();
            if (element) {
                console.log(element);
                return Promise.reject(element.innerText);
            }

            var vehicle = {};
            Promise.all(fields.map(async (field) => {
                if (field.selector) {
                    // `//p[@class='vrlDT-label-p' and contains(text(),'Vehicle Type')]/following-sibling::p[@class='vrlDT-content-p']`
                    var xpath = `//p[@class='vrlDT-label-p' and contains(text(),'${field.selector}')]/following-sibling::p[@class='vrlDT-content-p']`;
                    var element = document.evaluate(xpath, document).iterateNext();
                    vehicle[field.name] = element.innerText;
                }
            }));

            const vehicleNumXpath = `//i[contains(text(), 'Vehicle No.')]/following::p`;
            const makeModelXpath = `//i[contains(text(), 'Make / Model')]/following::p`;

            var vehicleNumElement = document.evaluate(vehicleNumXpath, document).iterateNext();
            vehicle['license_plate'] = vehicleNumElement.innerText.trim();

            var makeModelElement = document.evaluate(makeModelXpath, document).iterateNext();
            var makeModel = makeModelElement.innerText.trim().split('  /  ');
            vehicle['vehicle_make'] = makeModel[0];
            vehicle['vehicle_model'] = makeModel[1];
        
            return vehicle;
        }, fields).catch((error) => {
            browser.close();
            // fs.rmSync(userDataDir, {recursive: true});
            return Promise.reject(error);
        })

        fields.map((field) => {
            if (field.postProcess) {
                vehicle[field.name] = field.postProcess(vehicle[field.name]);
            }
        });

        console.log(vehicle);
        console.log('transfer done');
        await browser.close();
        // fs.rmSync(userDataDir, {recursive: true});
        return vehicle;
    } catch (error) {
        await browser.close();
        // fs.rmSync(userDataDir, {recursive: true});
        return Promise.reject(error);
    }
}
exports.getTransferInfo = getTransferInfo;

async function getRoadTaxInfo(data) {
    // const uuid = uuidv4();
    // const userDataDir = `${__dirname}/userdatadir/${uuid}`;
    // fs.cpSync(`${__dirname}/userdatatemplates/roadtax`, userDataDir, {recursive: true});
    // prbOptions.args = [`--user-data-dir=${userDataDir}`, `--hide-crash-restore-bubble`];

    console.log(`[${data.license_plate}] opening browser for road tax ..`);
    const { browser, page } = await connect(prbOptions);

    try {

        console.log(`[${data.license_plate}] opening page for road tax ..`);
        await page.goto(LTA_ROADTAX_URL, { waitUntil: "networkidle0", timeout: 30000 });
        await sleep(500);

        console.log(`[${data.license_plate}] filling in info for road tax..`);

        await page.select('#checkByField', "1");
        await sleep(500);

        await page.click('#vehNoField');
        await sleep(500);
        await page.type('#vehNoField', data.license_plate, { delay: getRandomInt(200,300) });
        await sleep(500);
        
        await page.$eval('#btnNext', (element, value) => {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
        await sleep(500);

        await page.click('#select_renewalPrd > label:nth-child(1) > span');
        await sleep(500);

        await page.click('#agreeTCbox');
        await sleep(500);
        
        await page.click('#btnNext');    
        await page.waitForNavigation();
        await sleep(500);
        
        //Check for recaptcha error for retry
        var recaptchaError = await page.evaluate(() => {
            var errXpath = `//td[@class='errorTxtRedBold12pt']/ul/li`;
            var element = document.evaluate(errXpath, document).iterateNext();
            if (element) {
                console.log(element);
                var errorMessage = element.innerText;
                if (errorMessage.includes('CM00149')) {
                    return true
                }
                return false
            }
        });

        if (recaptchaError) {
            console.log(`[${data.license_plate}] refilling in info for road tax..`);

            await sleep(1000);

            await page.click('#vehNoField');
            await sleep(500);
            await page.type('#vehNoField', data.license_plate, { delay: getRandomInt(200,300) });
            await sleep(500);

            await page.$eval('#btnNext', (element, value) => {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            });
            await sleep(500);

            await page.click('#select_renewalPrd > label:nth-child(1) > span');
            await sleep(500);

            await page.click('#agreeTCbox');
            await sleep(500);

            console.log(`[${data.license_plate}] resubmitting form for road tax ..`);
            await page.click('#btnNext');
            await page.waitForNavigation();
            await sleep(500);
        }

        //Check for 6-month only renewal
        var sixMonthOnlyError = await page.evaluate(() => {
            var errXpath = `//td[@class='errorTxtRedBold12pt']/ul/li`;
            var element = document.evaluate(errXpath, document).iterateNext();
            if (element) {
                console.log(element);
                var errorMessage = element.innerText;
                if (errorMessage.includes('UL03090')) {
                    return true
                }
                return false
            }
        });

        if (sixMonthOnlyError) {
            console.log('resubmitting form for six months ..');
            await page.$eval('#checkByField', (element, value) => {
                element.value = value;
                element.dispatchEvent(new Event('change'));
            }, "1");
        
            await page.$eval('#vehNoField', (element, value) => {
                element.value = value;
                element.dispatchEvent(new Event('change'));
            }, data.license_plate);
        
            await sleep(3000);
        
            await page.click('#select_renewalPrd > label:nth-child(2) > span');
            await page.click('#agreeTCbox');
            var navPromise = page.waitForNavigation();
            await page.click('#btnNext');
            console.log('submitting form again ..');
            await navPromise;
        }

        // Check for laid up vehicle
        const laidUpHandle = await page.waitForSelector('#startDateField', {visible: true, timeout: 100}).then(() => true).catch(() => false); //startDateField is always a hidden field
        if (laidUpHandle) {
            console.log('additional step for laid-up vehicle ..');
            var laidUpStartDateElement = await page.$eval('#startDateField', (element, value) => {
                element.value = value;
                element.dispatchEvent(new Event('change'));
            }, data.intended_transfer_date);

            await sleep(2000);

            var navPromise = page.waitForNavigation();
            await page.click('.dt-btn-proceed');
            await navPromise;
        }

        //Proceed with extraction of data
        console.log(`[${data.license_plate}] extracting info for road tax..`);
        const fields = [ // accurate as of 30 June 2023
            {name: "license_plate", selector: `//p[@class='vrlDT-label-p' and contains(text(),'Vehicle No.')]/following-sibling::p[@class='vrlDT-content-p']`},
            {name: "road_tax_expiry", selector: `//p[@class='vrlDT-label-p' and contains(text(),'Current Road Tax Expiry Date')]/following-sibling::p[@class='vrlDT-content-p']`},
            {name: "sufficient_insurance_coverage", selector: `//td[@class='dt-paymentsunnary-label' and contains(text(), 'Sufficient Insurance Coverage')]/following-sibling::td`},
            {name: "vehicle_inspection_required", selector: `//td[@class='dt-paymentsunnary-label' and contains(text(), 'Vehicle Inspection Required')]/following-sibling::td`},
            {name: "road_tax_amount", selector: `//td[@class='dt-paymentsunnary-label' and contains(text(), 'Road Tax Amount')]/following-sibling::td`},
            {name: "road_tax_amount_base", selector: `//td[@class='dt-paymentsunnary-label' and contains(text(), 'Base Road Tax Amount')]/following-sibling::td`},
            {name: "road_tax_amount_payable", selector: `//td[@class='dt-paymentsunnary-labelTotal' and contains(strong, 'Total Amount Payable')]/following-sibling::td/strong`},
            {name: "new_road_tax_start_date", selector: `//div[contains(h5, 'New Road Tax Start Date')]/following-sibling::div`},
            {name: "new_road_tax_expiry_date", selector: `//div[contains(h5, 'New Road Tax Expiry Date')]/following-sibling::div`}
            
        ];

        var vehicle = await page.evaluate((fields, data) => {
            var errXpath = `//td[@class='errorTxtRedBold12pt']/ul/li`;
            var element = document.evaluate(errXpath, document).iterateNext();
            if (element) {
                console.log(element);
                var errorMessage = element.innerText;
                if (errorMessage.includes('UL00024')) {
                    paidUpRoadTax = {
                        license_plate: data.license_plate,
                        road_tax_expiry: null,
                        sufficient_insurance_coverage: 'Yes',
                        vehicle_inspection_required: 'No',
                        road_tax_amount: 'S$0.00',
                        road_tax_amount_base: 'S$0.00',
                        road_tax_amount_payable: 'S$0.00'
                    };
                    return paidUpRoadTax;
                }
                
                return Promise.reject(element.innerText);
            }
            
            var vehicle = {};
            Promise.all(fields.map(async (field) => {
                var xpath = field.selector;
                var element = document.evaluate(xpath, document).iterateNext();
                console.log(element.innerText);
                vehicle[field.name] = element.innerText;
            }));
            return vehicle;
        }, fields, data).catch((error) => {
            browser.close();
            // fs.rmSync(userDataDir, {recursive: true});
            return Promise.reject(error);
        });

        if (!vehicle.road_tax_expiry){ // for laid-up vehicles, return null road tax expiry date
            vehicle.road_tax_expiry = null;
        }

        console.log(vehicle);
        console.log(`[${data.license_plate}] roadtax done`);
        await browser.close();
        // fs.rmSync(userDataDir, {recursive: true});
        return vehicle;
    } catch (error) {
        await browser.close();
        // fs.rmSync(userDataDir, {recursive: true});
        return Promise.reject(error);
     }
}

exports.getRoadTaxInfo = getRoadTaxInfo;

async function getRoadTaxInfoWithRetry(data, retries) {
    if (retries == 0) {
        return Promise.reject("road_tax_max_retries");
    }

    vehicle = await getRoadTaxInfo(data).catch((error) => {
        console.log("road tax retry", retries, error);
        return getRoadTaxInfoWithRetry(data, retries-1);
    })

    return vehicle;
}

exports.getRoadTaxInfoWithRetry = getRoadTaxInfoWithRetry;

async function getTransferInfoWithRetry(data, retries) {
    if (retries == 0) {
        return Promise.reject("transfer_max_retries");
    }

    vehicle = await getTransferInfo(data).catch((error) => {
        console.log("transfer retry", retries, error);
        return getTransferInfoWithRetry(data, retries-1);
    })

    return vehicle;
}

exports.getTransferInfoWithRetry = getTransferInfoWithRetry;

async function getRebateInfoWithRetry(data, retries) {
    if (retries == 0) {
        return Promise.reject("rebate_max_retries");
    }

    vehicle = await getRebateInfo(data).catch((error) => {
        console.log("rebate retry", retries, error);
        return getRebateInfoWithRetry(data, retries-1);
    })

    return vehicle;
}

exports.getRebateInfoWithRetry = getRebateInfoWithRetry;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, getRandomInt(ms, ms+500)));
}

function getRandomInt(min, max) {
    const minCeiled = Math.ceil(min);
    const maxFloored = Math.floor(max);
    return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled); // The maximum is exclusive and the minimum is inclusive
  }

/* Road Tax Samples

Normal:
{ 
  license_plate: 'SKK4209B',
  road_tax_expiry: '25 Jul 2023',
  sufficient_insurance_coverage: 'No',
  vehicle_inspection_required: 'Yes',
  road_tax_amount: 'S$1,413.00',
  road_tax_amount_base: 'S$1,413.00',
  road_tax_amount_payable: 'S$1,413.00',
  new_road_tax_start_date: '26 Jul 2023',
  new_road_tax_expiry_date: '25 Jul 2024'
}

Laid-up:

{
  license_plate: 'FE773E',
  sufficient_insurance_coverage: 'No',
  vehicle_inspection_required: 'Yes',
  road_tax_amount: 'S$332.00',
  road_tax_amount_base: 'S$332.00',
  road_tax_amount_payable: 'S$332.00',
  new_road_tax_start_date: '01 Jul 2023',
  new_road_tax_expiry_date: '30 Jun 2024',
  road_tax_expiry: null
}

Laid-Up + 6 Months Only:
{
  license_plate: 'PC2021X',
  sufficient_insurance_coverage: 'Yes',
  vehicle_inspection_required: 'Yes',
  road_tax_amount: 'S$351.00',
  road_tax_amount_base: 'S$351.00',
  road_tax_amount_payable: 'S$351.00',
  new_road_tax_start_date: '01 Jul 2023',
  new_road_tax_expiry_date: '31 Dec 2023',
  road_tax_expiry: null
}

Paid-Up:
{
  license_plate: 'SKM3323A',
  road_tax_expiry: null,
  sufficient_insurance_coverage: 'Yes',
  vehicle_inspection_required: 'No',
  road_tax_amount: 'S$0.00',
  road_tax_amount_base: 'S$0.00',
  road_tax_amount_payable: 'S$0.00'
}

*/