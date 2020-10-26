// import { LRUMap } from 'lru_map';
import { Logger, BadRequestException } from '@nestjs/common';
import { createWriteStream } from 'fs';
var url = require('url');
var http = require('http');
var request = require("request");

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


export function getAgeInYearsFromDOB(dateOfBirth: Date): number {
    var today = new Date();
    var birthDate = new Date(dateOfBirth);
    var age = today.getFullYear() - birthDate.getFullYear();
    var m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age = age - 1;
    }
    return age;
}


export function daysAgo(days: number): Date {
    var d = new Date();
    d.setDate(d.getDate() - days);
    d.setHours(0, 0, 0, 0);
    return d;
}


export function yearsAgo(years: number): Date {
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


export function showObjectProperties(object, objectName) {
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
    let stack = new Error().stack
    let caller = stack.split('\n')[2].trim();
    // console.log(caller + ":" + message);
    return caller;
}


// ref - http://www.howtocreate.co.uk/xor.html
export function myXOR(x: any, y: any): boolean {
    return !x != !y
}


export function setDifference<T>(setA: Set<T>, setB: Set<T>): Set<T> {
    let _difference = new Set(setA)
    for (let elem of setB) {
        _difference.delete(elem)
    }
    return _difference
}


export function setDifferenceFromArrays<T>(arrayA: Array<T>, arrayB: Array<T>): Array<T> {
    let setA = new Set(arrayA), setB = new Set(arrayB);
    const _difference = setDifference(setA, setB);
    return Array.from(_difference);
}


export function deDuplicateArray<T>(array: Array<T>): Array<T> {
    let _set = new Set<T>(array);
    return Array.from(_set);
}


export async function downloadFile(file_url: string, fileName: string) {

    const downloadDir = '/tmp/'

    /* Create an empty file where we can save data */
    let file = createWriteStream(downloadDir + fileName);

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
                console.log(`The file is finished downloading.`);
                resolve();
            })
            .on('error', (error) => {
                reject(error);
            })
    })
        .catch(error => {
            console.log(`Could not download file: ${error}`);
        });
}


export function download_file_httpget(file_url: string, file_name: string) {
    const DOWNLOAD_DIR = '/tmp/'
    var options = {
        host: url.parse(file_url).host,
        port: 80,
        path: url.parse(file_url).pathname
    };

    // var file_name = url.parse(file_url).pathname.split('/').pop();
    var file = createWriteStream(DOWNLOAD_DIR + file_name);

    http.get(options, function (res) {
        res.on('data', function (data) {
            file.write(data);
        }).on('end', function () {
            file.end();
            console.log(file_name + ' downloaded to ' + DOWNLOAD_DIR);
        });
    });
};