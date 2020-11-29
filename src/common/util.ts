// import { LRUMap } from 'lru_map';
import { Logger, BadRequestException } from '@nestjs/common';
import { createWriteStream } from 'fs';
const fs = require('fs').promises;
import { promisify } from "util"; // node-js inbuilt util 
import { join } from 'path';
import url from 'url';
import http from 'http';
const request = require("request"); // does not work with import syntax.
const watermark = require('image-watermark');  // does not work with import syntax.
import { convert } from 'libreoffice-convert';
import { degrees, PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { months } from './enum';
import { isNil } from 'lodash';

// pdftk.configure({
//     // bin: '/your/path/to/pdftk/bin',
//     // Promise: require('bluebird'),
//     ignoreWarnings: true,
//     tempDir: '/tmp/'
// });

const watermarkOptions = {
    'text': 'wouldbee.com',
    'override-image': false,
    'align': 'ltr',
    'position': 'South'
};

const lib_convert = promisify(convert)

const logger = new Logger('util');

export function remap(x: number, oldMin: number, oldMax: number, newMin: number, newMax: number) {
    //range check
    if (oldMin >= oldMax) {
        throw new Error(`bad old range!, ${oldMin} -- ${oldMax}`);
    }

    if (newMin >= newMax) {
        throw new Error(`bad new range!', ${newMin} -- ${newMax}`);
    }

    return newMin + ((x - oldMin) * (newMax - newMin) / (oldMax - oldMin));
}


export function coinToss(trueProbability: number = 0.5): boolean {
    if (isNaN(trueProbability) || trueProbability < 0 || trueProbability > 1)
        throw new Error('probability cannot be less than 0 and more than 1');
    const randomValue = Math.random();
    // console.log(`\n -- coinToss(): value: ${randomValue} | threshold: ${trueProbability} --\n`);
    return randomValue < trueProbability;
}


export function randomInteger(min: number, max: number): number {
    min = Math.floor(min);
    max = Math.floor(max);
    if (min > max) {
        throw new Error(`randomInteger() - bad range, ${min} -- ${max}`);
    } else if (min === max) {
        return min;
    }
    return Math.floor(min + (Math.random() * (max - min + 1)))
}


export function choice<T>(array: Array<T>): T {
    if ((!array) || (!array.length)) {
        throw new Error('Cannot choose from null or empty array!');
    }
    const index = randomInteger(0, array.length - 1);
    return array[index];
}


export function sample<T>(array: Array<T>, sampleSize: number, repeatsAllowed = false): Array<T> {

    sampleSize = Math.floor(sampleSize);
    // console.log('\nsample():', array, array.length, sampleSize, repeatsAllowed);

    if (!repeatsAllowed && array.length < sampleSize) {
        throw new Error('Cannot sample more values than are in range if repeats are not allowed!');
    }

    const indices: number[] = [];
    for (let i = 0; i < array.length; i++)
        indices.push(i);

    const values: T[] = []
    while (values.length < sampleSize) {
        const index = randomInteger(0, indices.length - 1);
        // Necessary so that if two samples give the same index they still give different values 
        const value: T = array[indices[index]];
        values.push(value);
        if (!repeatsAllowed) {
            // we splice the indices so the original array is not mutated!
            indices.splice(index, 1);
            // console.log('index:', index, 'spliced array:', array, 'sampled values:', values)
        }
    }

    return values;
}


export function shuffle<T>(array: Array<T>): Array<T> {
    return sample(array, array.length);
}


export function sampleIntegers(min: number, max: number, sampleSize: number, repeatsAllowed = false): Array<number> {
    // console.log('\sampleIntegers():', min, max, sampleSize, repeatsAllowed);
    min = Math.floor(min);
    max = Math.floor(max);
    if (min >= max) {
        throw new Error(`sampleIntegers() - bad range, ${min} -- ${max}`);
    }
    let array: number[] = []
    for (let i = min; i <= max; i++) {
        array.push(i);
    }

    return sample(array, sampleSize, repeatsAllowed);
}


export function getMinAndMaxFromPgRange(pgRange: string, intTrueFloatFalse: boolean = true): [number, number] {
    // console.log('pgRange:', pgRange);
    // console.log(pgRange.split('['), pgRange.split(')'));
    if (!pgRange || pgRange.trim().length === 0) {
        throw new Error(`null/undefined/empty range: ${pgRange}`);
    }
    const [min, max] = pgRange.split('[')[1].split(')')[0].split(',').map(
        each => intTrueFloatFalse ? parseInt(each) : parseFloat(each));
    return [min, max];
}


// check if a number is within a postgres number range
export function withinPGRange(what: number, range: string) {
    const [min, max] = getMinAndMaxFromPgRange(range, false);
    return (min <= what && what <= max);
}


export function getDateStringWithoutTime(date?: Date): string {
    date = date ?? new Date();
    return [date.getDate(), date.getMonth(), date.getFullYear()].join('-');
}


export function getAgeInYearsFromDOB(dateOfBirth: Date): number {
    logger.log(`-> getAgeInYearsFromDOB(${dateOfBirth})`);
    var today = new Date();
    var birthDate = new Date(dateOfBirth);
    var age = today.getFullYear() - birthDate.getFullYear();
    var m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age = age - 1;
    }
    logger.log(`getAgeInYearsFromDOB -> age: (${age})`);
    return age;
}


export function shiftDays(days: number, agoTrueAheadFalse: boolean, setTimeToZero?: boolean): Date {
    logger.log(`-> shiftDays(${days}, ${agoTrueAheadFalse}, ${setTimeToZero})`);
    var d = new Date();

    if (agoTrueAheadFalse)
        d.setDate(d.getDate() - days);
    else
        d.setDate(d.getDate() + days);

    if (setTimeToZero)
        d.setHours(0, 0, 0, 0);

    logger.log(`shiftDays -> d: (${d})`);
    return d;
}


export function daysAhead(days: number, setTimeToZero = true): Date {
    return shiftDays(days, false, setTimeToZero);
}


export function daysAgo(days: number, setTimeToZero = true): Date {
    // var d = new Date();
    // d.setDate(d.getDate() - days);
    // d.setHours(0, 0, 0, 0);
    // return d;
    return shiftDays(days, true, setTimeToZero);
}


export function yearsAgo(years: number): Date {
    logger.log(`-> yearsAgo(${years})`);
    var d = new Date();
    d.setDate(d.getDate() - years);
    d.setHours(0, 0, 0, 0);
    return d;
}


export function yesterday(): Date {
    return daysAgo(1);
}


export function lastWeek(): Date {
    return daysAgo(7);
}


export function nextWeek(): Date {
    return daysAhead(7);
}


export function showObjectProperties(object, objectName) {
    logger.log(`-> showObjectProperties(${objectName})`);
    var result = ``;
    for (var property in object) {
        if (object.hasOwnProperty(property)) {
            result += `${objectName}.${property} = ${object[property]}\n`;
        }
    }
    return result;
}


const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
const digits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];


export function randomSharableIdGenerator(): string {
    logger.log(`-> randomSharableIdGenerator()`);
    const sharableId: string[] = [];
    for (let i = 1; i <= 8; i++) {
        if (i <= 4) {
            sharableId.push(choice(letters));
        } else {
            sharableId.push(choice(digits));
        }
    }
    return sharableId.join('');
}


export function convertLettersToDigits(letterList: string): string {
    logger.log(`-> convertLettersToDigits(${letterList})`);
    const letterIndices: string[] = [];
    for (let letter of letterList) {
        let index = letters.findIndex(value => value === letter);
        // console.log(letterList, letter, index);
        if (index === -1) {
            // logger.warn(`fn convertLettersToDigits():: Could not find index of letter ${letter} from ${letterList}`);
            throw new BadRequestException(`fn convertLettersToDigits():: Could not find index of letter ${letter} from ${letterList}`)
        }
        letterIndices.push((index + 1).toString());
    }
    return letterIndices.join('');
}


// export class LoaderCacheMap<K, V>{
//     // private map: Map<K, V>;
//     private map: LRUMap<K, V>;
//     constructor(private size: number = 0) {
//         this.map = new LRUMap<K, V>(size);
//     }

//     get(key: K): V | void {
//         // console.log(` -- cache size is ${this.map.size} -- `);
//         if (this.map.has(key)) {
//             return this.map.get(key)[0];
//         }
//     }

//     set(key: K, value: V): any {
//         this.map.set(key, value);
//         // if (this.map.size > this.size * 1.1) {
//         // this.reduceSize();
//         // }
//     }

//     delete(key: K): any {
//         if (this.map.has(key)) {
//             this.map.delete(key);
//         }
//     }

//     clear(): any {
//         this.map.clear();
//     }

//     // reduceSize() {}
// }


// ref - https://stackoverflow.com/questions/38435450/get-current-function-name-in-strict-mode
export function getCallerFunctionName(): string {
    logger.log(`-> getCallerFunctionName()`);
    let stack = new Error().stack
    let caller = stack.split('\n')[2].trim();
    // console.log(caller + ":" + message);
    return caller;
}


// ref - http://www.howtocreate.co.uk/xor.html
export function myXOR(x: any, y: any): boolean {
    logger.log(`-> myXOR(${x}, ${y})`);
    return !x != !y
}


export function setDifference<T>(setA: Set<T>, setB: Set<T>): Set<T> {
    logger.log(`-> setDifference(${setA}, ${setB})`);
    let _difference = new Set(setA)
    for (let elem of setB) {
        _difference.delete(elem)
    }
    return _difference
}


export function setDifferenceFromArrays<T>(arrayA: Array<T>, arrayB: Array<T>): Array<T> {
    logger.log(`-> setDifferenceFromArrays(${arrayA}, ${arrayB})`);
    let setA = new Set(arrayA), setB = new Set(arrayB);
    const _difference = setDifference(setA, setB);
    return Array.from(_difference);
}


export function deDuplicateArray<T>(array: Array<T>): Array<T> {
    logger.log(`-> deDuplicateArray(${array})`);
    let _set = new Set<T>(array);
    return Array.from(_set);
}


export async function downloadFile(file_url: string, fileName: string,
    dir: string) {
    logger.log(`-> downloadFile(${file_url}, ${fileName}, ${dir})`);
    const inputFilePath = isNil(dir) ? fileName : join(dir, fileName);

    /* Create an empty file where we can save data */
    let file = createWriteStream(inputFilePath);

    /* Using Promises so that we can use the ASYNC AWAIT syntax */
    await new Promise((resolve, reject) => {
        let stream = request({
            /* Here you should specify the exact link to the file you are trying to download */
            uri: file_url,
            headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Accept-Encoding': 'gzip, deflate, br',
                'Accept-Language': 'en-US,en;q=0.9,fr;q=0.8,ro;q=0.7,ru;q=0.6,la;q=0.5,pt;q=0.4,de;q=0.3',
                'Cache-Control': 'max-age=0',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.106 Safari/537.36'
            },
            /* GZIP true for most of the websites now, disable it if you don't need it */
            gzip: true
        })
            .pipe(file)
            .on('finish', () => {
                logger.log(`Finished downloading ${inputFilePath}`);
                resolve();
            })
            .on('error', (error) => {
                reject(error);
            })
    })
        .catch(error => {
            logger.error(`Could not download file: ${error}`);
        });
}


export function download_file_http_get(file_url: string, fileName: string,
    dir?: string) {
    logger.log(`-> download_file_http_get(${file_url}, ${fileName}, ${dir})`);

    const inputFilePath = isNil(dir) ? fileName : join(dir, fileName);

    const options = {
        host: url.parse(file_url).host,
        port: 80,
        path: url.parse(file_url).pathname
    };

    const file = createWriteStream(inputFilePath);

    http.get(options, function (res) {
        res.on('data', function (data) {
            file.write(data);
        }).on('end', function () {
            file.end();
            logger.log('file downloaded to: ' + inputFilePath);
        });
    });
};


export async function deleteFile(fileName: string, dir?: string) {
    logger.log(`-> deleteFile(${fileName}, ${dir})`);
    const inputFilePath = isNil(dir) ? fileName : join(dir, fileName);
    try {
        await fs.unlink(inputFilePath);
    } catch (err) {
        logger.error(`Could not delete file: ${inputFilePath}`);
    }
}


// TODO: use something else for PDF files as it produces bad quality PDF.
export function watermarkImage(fileName: string, dir?: string, outputFilePath?: string): Promise<string | undefined> {
    logger.log(`-> watermarkImage(${fileName}, ${dir})`);
    const inputFilePath = isNil(dir) ? fileName : join(dir, fileName);
    outputFilePath = outputFilePath ?? inputFilePath;

    watermarkOptions['dstPath'] = outputFilePath;

    return new Promise((resolve, reject) => {
        watermark.embedWatermarkWithCb(
            inputFilePath, watermarkOptions, function (err) {
                if (!err) {
                    resolve(fileName);
                }
                else {
                    logger.error(`could not watermark image: ${inputFilePath}. Error: ${JSON.stringify(err)}`,);
                    reject(err);
                }
            });
    });
}


/**
 * TODO: It has external dependency on pdftk server software (free though)
 */
// export function stampFile(fileName: string, DIR = '/tmp/') {
//     pdftk
//         .input(readFileSync(join(DIR, fileName)))
//         .stamp('assets/would_bee_logo.png')
//         .output(join(DIR, fileName))
//         .catch(err => {
//             logger.log(`Could not stamp file: ${join(DIR, fileName)}`);
//             throw err;
//         });
//     logger.log('stamped file: ' + join(DIR, fileName));
//     return fileName;
// }


// maps file extension to MIME types
// full list can be found here: https://www.freeformatter.com/mime-types-list.html
export const mimeTypes = {
    '.ico': 'image/x-icon',
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.css': 'text/css',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.wav': 'audio/wav',
    '.mp3': 'audio/mpeg',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.zip': 'application/zip',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.eot': 'application/vnd.ms-fontobject',
    '.ttf': 'application/x-font-ttf',
};


// requires libre-office
export async function doc2pdf(fileName: string, dir?: string, outputFilePath?: string): Promise<string | null> {
    logger.log(`-> doc2pdf(${fileName}, ${dir}, ${outputFilePath})`);
    const inputFilePath = isNil(dir) ? fileName : join(dir, fileName);
    let newFileName: string;
    try {
        const nameSplit = fileName.split('.');
        const extension = nameSplit.length > 1 ? nameSplit.pop() : '';
        if (extension !== 'doc' && extension !== 'docx') {
            logger.error(`Can only convert word files with doc/docx extension. 
            But Received ${fileName} with "${extension}" extension.`);
        }
        newFileName = `${nameSplit[0]}.pdf`;
        outputFilePath = outputFilePath ?? join(dir, newFileName);

        // Read file
        let data = await fs.readFile(inputFilePath);
        let done = await lib_convert(data, '.pdf', undefined);
        await fs.writeFile(outputFilePath, done);
        logger.log('converted file to pdf, path: ' + outputFilePath);

    } catch (err) {
        logger.error(`could not convert ${inputFilePath} to pdf: ${JSON.stringify(err)}`);
        throw err;
    }
    return newFileName;
}


export async function watermarkPdf(fileName: string, dir?: string, outputFilePath?: string): Promise<string | null> {
    logger.log(`-> watermarkPdf(${fileName}, ${dir}, ${outputFilePath})`);

    const inputFilePath = isNil(dir) ? fileName : join(dir, fileName);
    outputFilePath = outputFilePath ?? inputFilePath;

    const existingPdfBytes = await fs.readFile(inputFilePath);
    const pngImageBytes = await fs.readFile('assets/would_bee_logo.png');
    // let data = await fs.readFile(inputFilePath);
    // let existingPdfBytes = data.arrayBuffer();

    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const pngImage = await pdfDoc.embedPng(pngImageBytes);
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const pages = pdfDoc.getPages();
    for (const page of pages) {
        const { width, height } = page.getSize();

        page.drawImage(pngImage, {
            x: width / 2 - 25,
            y: 20,
            height: 50, width: 50
        });
        // page.drawText('wouldbee.com', {
        //     x: 25,
        //     // y: height / 2 + 300,
        //     y: height - 20,
        //     size: 12,
        //     font: helveticaFont,
        //     // color: rgb(0.95, 0.1, 0.1),
        //     color: rgb(0.9531, 0, 0.4375),
        //     // rotate: degrees(-45),
        //     rotate: degrees(0),
        // });

        page.drawText('wouldbee.com', {
            x: width - 10,
            y: height / 2,
            size: 12,
            font: helveticaFont,
            color: rgb(0.9531, 0, 0.4375),
            rotate: degrees(90),
        });
    }

    const pdfBytes = await pdfDoc.save()
    await fs.writeFile(outputFilePath, pdfBytes);
    return fileName;
}


export function getEnumValues(enumType: Object): number[] {
    logger.log(`-> getEnumValues(${JSON.stringify(enumType)}`);
    return Object.values(enumType).filter(value => typeof value === 'number');
}


export function getHumanReadableDate(date?: Date): string {
    if (!date) date = new Date();
    return date.getDate() + "-" + months[date.getMonth()] + "-" + date.getFullYear();

}


export function toTitleCase(input: string) {
    let str = input.replace(/_/g, ' ');

    str = input.replace(/DASH/g, '-');
    str = input.replace(/SLASH/g, '/');
    str = input.replace(/OR/g, '/');

    str = input.replace(/([^\W_]+[^\s-]*) */g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });

    // Certain minor words should be left lowercase unless 
    // they are the first or last words in the string
    let lowers = ['A', 'An', 'The', 'And', 'But', 'Or', 'For', 'Nor', 'As', 'At',
        'By', 'For', 'From', 'In', 'Into', 'Near', 'Of', 'On', 'Onto', 'To', 'With'];
    for (let i = 0, j = lowers.length; i < j; i++)
        str = str.replace(new RegExp('\\s' + lowers[i] + '\\s', 'g'),
            function (txt) {
                return txt.toLowerCase();
            });

    // Certain words such as initialisms or acronyms should be left uppercase
    let uppers = ['Id', 'Tv', 'IT', 'ITES', 'BPO', 'IAS', 'IPS', 'IFS', 'IRS', 'CEO', 'CTO', 'CXO'];
    for (let i = 0, j = uppers.length; i < j; i++)
        str = str.replace(new RegExp('\\b' + uppers[i] + '\\b', 'g'),
            uppers[i].toUpperCase());

    return str;
}


// export async function botFunctionWrapper<Args extends any[], Return>(
//     fn: (...operationParameters: Args) => Return,
//     telegramAccount: TelegramAccount
//     ...parameters: Args
// ): Promise<Return> {
//     console.log(`outer `);
//     try {
//         const result = await fn(...parameters);
//         return result;
//     } catch (error) {
//         console.log(`Caught error!`);
//         if (error.code === 403) {
//             logger.warn(`Blocked by user`);
//         }
//     }
// }