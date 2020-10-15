export interface GetCityOptions {
    getState?: boolean;
    getCountry?: boolean;
    throwOnFail?: boolean;
}

export interface GetStateOptions {
    getCountry?: boolean;
    throwOnFail?: boolean;
}