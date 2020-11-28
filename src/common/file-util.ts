import { Logger } from "@nestjs/common";
import { existsSync } from "fs";
import { mkdirSync } from "fs";
import { TypeOfDocument } from "./enum";
import { exec } from 'child_process';
import { randomInteger } from "./util";

const logger = new Logger('file-util');

export function getBaseTempDir(): string {
    return `/tmp/wb/`;
}


export function getTempDir(typeOfDocument?: TypeOfDocument): string {
    logger.log(`-> getDir(${TypeOfDocument[typeOfDocument]})`);

    const dirPath = typeOfDocument ? `${getBaseTempDir()}${TypeOfDocument[typeOfDocument]}/` : `${getBaseTempDir()}common/`;

    logger.log(dirPath);
    return dirPath;
}


export function getAllTempDirs(): string[] {
    logger.log(`-> getAllTempDirs()`);

    const typeOfDocumentList = Object.values(TypeOfDocument).filter(value => typeof value === 'number');
    logger.log(`typeOfDocumentList: ${typeOfDocumentList}`);

    const dirPaths = [getTempDir()]; // initialize with common path
    for (let typeOfDocument = TypeOfDocument.PICTURE; typeOfDocument <= TypeOfDocument.REPORT_ATTACHMENT; typeOfDocument++) {
        dirPaths.push(getTempDir(typeOfDocument));
    }

    return dirPaths;
}


export function createTempDirs() {
    logger.log(`-> createTempDirs()`);
    const dirPaths = getAllTempDirs();

    dirPaths.forEach(dirPath => {
        try {
            if (!existsSync(dirPath)) {
                mkdirSync(dirPath);
                logger.log(`Created directory: ${dirPath}`);
            }
        } catch (error) {
            logger.error(`Could not create directory at path: ${dirPath}. ERROR:\n ${JSON.stringify(error)}`);
        }
    });
}


export function cleanTempDirs(olderThanDays = 3, logStdout = false) {
    logger.log(`-> cleanTempDirs()`);
    const dirPaths = getAllTempDirs();

    if (!olderThanDays || isNaN(olderThanDays)) {
        olderThanDays = 3;
    }

    //ref - https://askubuntu.com/questions/789602/auto-delete-files-older-than-7-days
    const mtime = Math.max(olderThanDays - 1, 1);

    const command = `find ${getBaseTempDir()}* -mtime +${mtime} -type f -delete`;
    logger.log(`command: "${command}"`);
    exec(command, (error, stdout, stderr) => {
        if (error) {
            logger.error(`exec error: ${error}`);
            return;
        }
        if (logStdout) {
            logger.log(`stdout: ${stdout}`);
            logger.error(`stderr: ${stderr}`);
        }
    });
}


export function imageFileFilter(req, file, callback) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
        return callback(new Error('Only image (jpg, jpeg, png) files are allowed!'), false);
    }
    callback(null, true);
};


export function docFileFilter(req, file, callback) {
    if (!file.originalname.match(/\.(pdf|doc|docx)$/)) {
        return callback(new Error('Only pdf, doc, and docx files are allowed!'), false);
    }
    callback(null, true);
};

const fileSizeLimit = 2202009.6
const ONE_MB = 1048576; // 1024*1024

export function imageOrDocFileFilter(req, file, callback) {
    if (!file.originalname.match(/\.(jpg|jpeg|png|pdf|doc|docx)$/)) {
        return callback(new Error('Only image (jpg, jpeg, png) and document (pdf, doc, docx) files are allowed!'), false);
    }
    if (file.size > fileSizeLimit) {
        const size = (file.size ?? 1 / ONE_MB).toFixed(2);
        return callback(new Error(`File size (=${size}) should not be more than 2 MB`), false);
    }
    callback(null, true);
};


export function editFileName(req, file, callback) {
    const name = file.originalname.split('.')[0];
    // const fileExtName = extname(file.originalname);
    const fileExtName = file.originalname.split('.')[1];
    const randomName = Array(randomInteger(3, 6))
        .fill(null)
        .map(() => Math.round(Math.random() * 16).toString(16))
        .join('');
    const now = Date.now();
    callback(null, `${name}-${randomName}-${now}.${fileExtName}`);
};