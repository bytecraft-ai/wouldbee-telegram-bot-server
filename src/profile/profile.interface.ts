import { TypeOfDocument } from "src/common/enum";

export interface GetCityOptions {
    getState?: boolean;
    getCountry?: boolean;
    throwOnFail?: boolean;
}


export interface GetStateOptions {
    getCountry?: boolean;
    throwOnFail?: boolean;
}


export interface GetTelegramProfilesOption {
    isValid?: boolean;
    withPhone?: boolean;
    withBio?: boolean;
    withPhoto?: boolean;
    withIdProof?: boolean;
    // skip?: number;
    // take?: number;
}


export interface GetAllDocumentsOption {
    telegramProfileId?: string;
    typeOfDocument?: TypeOfDocument;
}