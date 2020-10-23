export interface JwtPayload {
    username: string
}


export interface FailOption {
    throwOnFail: boolean;
}


export interface CommonData {
    maleAgeList: number[];
    femaleAgeList: number[];
}


export interface IList<T> {
    count: number;
    values: Array<T>;
}