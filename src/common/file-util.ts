export const imageFileFilter = (req, file, callback) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
        return callback(new Error('Only image (jpg, jpeg, png) files are allowed!'), false);
    }
    callback(null, true);
};


export const docFileFilter = (req, file, callback) => {
    if (!file.originalname.match(/\.(pdf|doc|docx)$/)) {
        return callback(new Error('Only pdf, doc, and docx files are allowed!'), false);
    }
    callback(null, true);
};


export const imageOrDocFileFilter = (req, file, callback) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png|pdf|doc|docx)$/)) {
        return callback(new Error('Only image (jpg, jpeg, png) and document (pdf, doc, docx) files are allowed!'), false);
    }
    callback(null, true);
};


export const editFileName = (req, file, callback) => {
    const name = file.originalname.split('.')[0];
    // const fileExtName = extname(file.originalname);
    const fileExtName = file.originalname.split('.')[1];
    const randomName = Array(4)
        .fill(null)
        .map(() => Math.round(Math.random() * 16).toString(16))
        .join('');
    callback(null, `${name}-${randomName}.${fileExtName}`);
};